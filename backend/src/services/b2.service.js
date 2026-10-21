import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

const isConfigured = Boolean(env.B2_ENDPOINT && env.B2_BUCKET && env.B2_KEY_ID && env.B2_APPLICATION_KEY)

// Lazily-created client so the app boots fine when B2 isn't configured (upload
// service falls back to local disk in that case).
let client = null
function getClient() {
  if (!client) {
    client = new S3Client({
      region: env.B2_REGION,
      endpoint: env.B2_ENDPOINT,
      credentials: {
        accessKeyId: env.B2_KEY_ID,
        secretAccessKey: env.B2_APPLICATION_KEY
      },
      forcePathStyle: true,
      maxAttempts: 2
    })
  }
  return client
}

// Where the stored object is publicly reachable. Prefers an explicit public URL
// override (e.g. a custom domain or CDN); otherwise derives one from the endpoint
// + bucket. Falls back to null when B2 isn't configured.
export function b2PublicUrl(key) {
  if (!isConfigured || !key) return null
  if (env.B2_PUBLIC_URL) return `${env.B2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  return `${env.B2_ENDPOINT.replace(/\/$/, '')}/${env.B2_BUCKET}/${key}`
}

export const b2Storage = {
  isConfigured,

  async uploadFile({ key, body, contentType }) {
    if (!isConfigured) throw new Error('B2 storage is not configured')
    await getClient().send(new PutObjectCommand({
      Bucket: env.B2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType
      // Public access is governed by the B2 bucket's public-read setting; B2's
      // S3 API rejects x-amz-acl headers, so we never pass ACL here.
    }))
    return { key, url: b2PublicUrl(key) }
  },

  async deleteFile(key) {
    if (!isConfigured || !key) return
    try {
      await getClient().send(new DeleteObjectCommand({ Bucket: env.B2_BUCKET, Key: key }))
    } catch (error) {
      // Deleting is best-effort — the DB record is what matters for the app.
      console.warn(`[b2] Delete skipped for ${key}: ${error.message}`)
    }
  }
}
