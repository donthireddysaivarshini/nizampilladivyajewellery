import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { uploadRepository } from '../repositories/upload.repository.js'
import { env } from '../config/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Resolves to backend/uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads')

const MUST_CONVERT_FORMATS = new Set(['heif', 'heic'])
const KEEP_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif'
])

async function optimizeImage(buffer) {
  try {
    const image = sharp(buffer, { failOn: 'none' })
    const metadata = await image.metadata()
    const sourceFormat = (metadata.format || '').toLowerCase()

    let pipeline = image.rotate()

    const maxDim = env.IMAGE_MAX_DIMENSION || 2048
    const exceedsMax = (metadata.width && metadata.width > maxDim) || (metadata.height && metadata.height > maxDim)
    if (exceedsMax) {
      pipeline = pipeline.resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    }

    const quality = env.IMAGE_QUALITY || 82
    const shouldConvertToJpeg = MUST_CONVERT_FORMATS.has(sourceFormat) || !KEEP_FORMATS.has(sourceFormat)

    if (shouldConvertToJpeg) {
      return {
        buffer: await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer(),
        extension: '.jpg',
        mimeType: 'image/jpeg'
      }
    }
    if (sourceFormat === 'png') {
      return { buffer: await pipeline.png({ quality, compressionLevel: 9 }).toBuffer(), extension: '.png', mimeType: 'image/png' }
    }
    if (sourceFormat === 'webp') {
      return { buffer: await pipeline.webp({ quality }).toBuffer(), extension: '.webp', mimeType: 'image/webp' }
    }
    // avif
    return { buffer: await pipeline.avif({ quality }).toBuffer(), extension: '.avif', mimeType: 'image/avif' }
  } catch (error) {
    console.warn(`[upload] Image optimization skipped, storing original as-is: ${error.message}`)
    return null
  }
}

export const uploadService = {
  async uploadImage(userId, file) {
    return this.uploadFile(userId, file, 'image')
  },

  async uploadFile(userId, file, type = 'image') {
    if (!file) {
      throw Object.assign(new Error('File is required'), { statusCode: 400 })
    }

    const mime = (file.mimetype || '').toLowerCase()
    if (!ALLOWED_IMAGE_MIMES.has(mime) && !mime.startsWith('image/')) {
      throw Object.assign(new Error('Only valid image files are supported (JPEG, PNG, WebP, AVIF, HEIC)'), { statusCode: 400 })
    }

    // 1. Get binary buffer
    const buffer = await file.toBuffer()
    const maxBytes = (env.UPLOAD_MAX_FILE_SIZE_MB || 10) * 1024 * 1024
    if (buffer.length > maxBytes) {
      throw Object.assign(new Error(`File exceeds maximum size of ${env.UPLOAD_MAX_FILE_SIZE_MB || 10}MB`), { statusCode: 400 })
    }

    // 2. Images go through optimization pipeline
    let finalBuffer = buffer
    let fileExtension = path.extname(file.filename || '').toLowerCase() || '.jpg'
    let mimeType = mime

    const optimized = await optimizeImage(buffer)
    if (optimized) {
      finalBuffer = optimized.buffer
      fileExtension = optimized.extension
      mimeType = optimized.mimeType
    }

    // 3. Safely generate a clean unique filename (prevent path traversal)
    const uniqueFileName = path.basename(`${crypto.randomUUID()}${fileExtension}`)

    // 4. Store locally on persistent disk
    const publicUrl = await this.storeLocal(uniqueFileName, finalBuffer)

    // 5. Save metadata track history into DB
    const safeOriginalName = path.basename(file.filename || uniqueFileName)
    return uploadRepository.create({
      uploadedBy: userId,
      url: publicUrl,
      key: uniqueFileName,
      fileName: safeOriginalName,
      mimeType,
      sizeBytes: finalBuffer.length
    })
  },

  async storeLocal(fileName, buffer) {
    const safeName = path.basename(fileName)
    const targetPath = path.join(UPLOAD_DIR, safeName)
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(targetPath, buffer)
    const baseUrl = env.API_BASE_URL || 'http://localhost:4000'
    return `${baseUrl.replace(/\/$/, '')}/uploads/${safeName}`
  },

  async deleteImage(id) {
    const upload = await uploadRepository.find(id)
    if (!upload) throw Object.assign(new Error('Upload not found'), { statusCode: 404 })

    if (upload.object_key) {
      const safeKey = path.basename(upload.object_key)
      const targetPath = path.join(UPLOAD_DIR, safeKey)
      try {
        await fs.unlink(targetPath)
      } catch (err) {
        console.warn(`File system unlink skipped or not found on disk: ${err.message}`)
      }
    }

    await uploadRepository.softDelete(id)
  },

  update: (id, patch) => uploadRepository.update(id, patch)
}