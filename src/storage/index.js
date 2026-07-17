// Unified media storage adapter.
//
// Production: Cloudflare R2 (S3-compatible, free 10GB, no egress fees).
//   Images are served directly from the public R2 bucket URL.
// Local dev: the local ./uploads directory (served by the existing /uploads route).
//
// Public surface:
//   upload(key, buffer, mimeType) -> Promise<{ url }>   (url stored in DB)
//   remove(key)              -> Promise<void>
//   publicUrl(key)          -> string
//   normalizeDbValue(value)  -> rewrites old /uploads/... paths to the active backend

const fs = require('fs');
const path = require('path');
const config = require('../config');

let impl = null;

function detect() {
  if (impl) return impl;
  if (config.storage.type === 'r2') {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({
      region: config.storage.region,
      endpoint: config.storage.endpoint,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
      },
      forcePathStyle: true
    });
    const bucket = config.storage.bucket;
    const base = config.storage.publicUrl;
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    impl = {
      isRemote: true,
      publicUrl(key) { return base + '/' + key; },
      async upload(key, buffer, mimeType) {
        await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType }));
        return { url: base + '/' + key };
      },
      async remove(key) {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      },
      async list(prefix) {
        const out = [];
        let token;
        do {
          const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
          for (const o of (res.Contents || [])) out.push({ key: o.Key, url: base + '/' + o.Key });
          token = res.IsTruncated ? res.NextContinuationToken : undefined;
        } while (token);
        return out;
      }
    };
  } else {
    const dir = config.storage.localPath;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    impl = {
      isRemote: false,
      publicUrl(key) { return '/uploads/' + key; },
      async upload(key, buffer, mimeType) {
        const fp = path.join(dir, key);
        const parent = path.dirname(fp);
        if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
        fs.writeFileSync(fp, buffer);
        return { url: '/uploads/' + key };
      },
      async remove(key) {
        const fp = path.join(dir, key);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      },
      async list(prefix) {
        const baseDir = path.join(dir, prefix);
        if (!fs.existsSync(baseDir)) return [];
        return fs.readdirSync(baseDir)
          .filter(f => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase()))
          .map(f => ({ key: prefix + '/' + f, url: '/uploads/' + prefix + '/' + f }));
      }
    };
  }
  return impl;
}

function isLocalUploadPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

// Normalize a DB-stored photo/path value to the active backend.
// In dev, values are like '/uploads/students/x.png' (served locally).
// In prod (R2), values must be the public URL 'https://.../key'.
function normalizeDbValue(value) {
  if (!value) return value;
  if (detect().isRemote) {
    // If a local /uploads path slipped in, convert to the R2 public URL.
    if (isLocalUploadPath(value)) return detect().publicUrl(value.replace('/uploads/', ''));
    return value;
  }
  // Local mode: ensure value is a /uploads/... path.
  if (value.startsWith('http')) return '/uploads/' + value.split('/').slice(3).join('/');
  return value;
}

function keyFromUrl(value) {
  if (!value) return null;
  if (value.startsWith('http')) return value.split('/').slice(3).join('/');
  if (isLocalUploadPath(value)) return value.replace('/uploads/', '');
  return value;
}

module.exports = {
  upload: (key, buffer, mimeType) => detect().upload(key, buffer, mimeType),
  remove: (key) => detect().remove(key),
  publicUrl: (key) => detect().publicUrl(key),
  normalizeDbValue,
  keyFromUrl,
  isRemote: () => detect().isRemote
};
