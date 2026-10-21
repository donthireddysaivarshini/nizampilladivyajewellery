import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { uploadRepository } from '../repositories/upload.repository.js'
import { env } from '../config/env.js'
import { b2Storage } from './b2.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Resolves to backend/uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Formats browsers can't render natively (or at all outside Safari/WebKit) always get
// converted to JPEG regardless of size — otherwise the image would upload "successfully"
// but just render as a broken icon in Chrome/Firefox/Windows.
const MUST_CONVERT_FORMATS = new Set(['heif', 'heic'])
// Formats we keep in their original encoding (just re-compressed + resized + rotated).
const KEEP_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])

// Runs the full optimization pipeline: auto-rotate from EXIF, strip metadata, resize
// only if over the configured max dimension, re-encode at the configured quality.
// Returns null (never throws) if Sharp can't process this input for any reason — the
// caller falls back to storing the original buffer untouched rather than failing the
// upload over an optimization step that's meant to be a quality-of-life improvement,
// not a hard requirement.
async function optimizeImage(buffer) {
  try {
    const image = sharp(buffer, { failOn: 'none' }) // tolerate minor/non-fatal format quirks
    const metadata = await image.metadata()
    const sourceFormat = (metadata.format || '').toLowerCase()

    // .rotate() with no args reads the EXIF Orientation tag, physically rotates the
    // pixels to match it, then discards the tag (it's now baked in and no longer
    // needed). Not calling .withMetadata() afterward means the rest of the EXIF block
    // (GPS, camera model, timestamps, etc.) is dropped from the output entirely —
    // this single combination satisfies both "auto-rotate using EXIF" and "strip
    // unnecessary metadata" at once, in the correct order.
    let pipeline = image.rotate()

    const maxDim = env.IMAGE_MAX_DIMENSION
    const exceedsMax = (metadata.width && metadata.width > maxDim) || (metadata.height && metadata.height > maxDim)
    if (exceedsMax) {
      // fit:'inside' preserves aspect ratio; withoutEnlargement guards against ever
      // upscaling a smaller image that happens to have one large-ish dimension.
      pipeline = pipeline.resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
    }

    const quality = env.IMAGE_QUALITY
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

  async uploadFile(userId, file, type = 'file') {
    // 1. Get the binary buffer out of Fastify's multipart stream
    const buffer = await file.toBuffer()

    // 2. Images go through the optimization pipeline; videos are untouched (no change
    // to existing video upload behavior).
    let finalBuffer = buffer
    let fileExtension = path.extname(file.filename) || (type === 'video' ? '.mp4' : '.jpg')
    let mimeType = file.mimetype

    if (type === 'image') {
      const optimized = await optimizeImage(buffer)
      if (optimized) {
        finalBuffer = optimized.buffer
        fileExtension = optimized.extension
        mimeType = optimized.mimeType
      }
    }

    // 3. Safely generate a clean unique filename
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`

    // 4. Store the file — Backblaze B2 when configured, otherwise the local disk.
    //    If B2 is configured but the upload itself fails (bucket outage, bad keys,
    //    network blip), fall back to the local disk. The DB record below is written
    //    once, with whatever URL actually won, so a transient B2 problem never
    //    bricks a product/catalog upload or leaves a dangling DB reference.
    let publicUrl
    if (b2Storage.isConfigured) {
      try {
        const stored = await b2Storage.uploadFile({
          key: uniqueFileName,
          body: finalBuffer,
          contentType: mimeType
        })
        publicUrl = stored.url
      } catch (b2Error) {
        console.warn(`[upload] B2 upload failed (${b2Error.message}); falling back to local disk`)
        publicUrl = await uploadService.storeLocal(uniqueFileName, finalBuffer)
      }
    } else {
      publicUrl = await uploadService.storeLocal(uniqueFileName, finalBuffer)
    }

    // 6. Save the metadata track history into the database repository snapshot
    return uploadRepository.create({
      uploadedBy: userId,
      url: publicUrl,
      key: uniqueFileName, // Store filename as key for easy file targeting during deletion
      fileName: file.filename,
      mimeType,
      sizeBytes: finalBuffer.length
    })
  },

  async storeLocal(fileName, buffer) {
    const targetPath = path.join(UPLOAD_DIR, fileName)
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(targetPath, buffer)
    const baseUrl = env.API_BASE_URL || 'http://localhost:4000'
    return `${baseUrl}/uploads/${fileName}`
  },

  async deleteImage(id) {
    const upload = await uploadRepository.find(id)
    if (!upload) throw Object.assign(new Error('Upload not found'), { statusCode: 404 })

    // Best-effort removal from BOTH backends. A file can end up on the local disk
    // in two ways — B2 unconfigured (primary mode) or B2 failed at upload time and
    // the service fell back to local disk. Trying both is a cheap no-op for the
    // backend the file doesn't live in, and guarantees we never leave an orphan.
    await b2Storage.deleteFile(upload.object_key)
    const targetPath = path.join(UPLOAD_DIR, upload.object_key)
    try {
      await fs.unlink(targetPath)
    } catch (err) {
      console.warn(`File system unlink skipped or not found on disk: ${err.message}`)
    }

    await uploadRepository.softDelete(id)
  },

  update: (id, patch) => uploadRepository.update(id, patch)
}