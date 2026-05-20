const sharp = require('sharp');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const COMPRESSED_MAX_BYTES = 2 * 1024 * 1024;
const COMPRESS_WIDTH = 1024;
const COMPRESS_QUALITY = 80;

class ImageProcessor {
  static async fetchImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const makeRequest = (url, redirects = 0) => {
        if (redirects > 5) return reject(new Error('Too many redirects'));
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': urlObj.origin + '/',
          },
          timeout: 15000,
        };

        client.get(url, options, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return makeRequest(response.headers.location, redirects + 1);
          }
          if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}`));

          const contentLength = parseInt(response.headers['content-length'] || '0', 10);
          if (contentLength > MAX_IMAGE_SIZE) return reject(new Error('Image too large'));

          const chunks = [];
          let totalSize = 0;
          response.on('data', (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_IMAGE_SIZE) {
              response.destroy();
              return reject(new Error('Image too large'));
            }
            chunks.push(chunk);
          });
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length === 0) return reject(new Error('Empty image'));
            const contentType = response.headers['content-type'] || 'image/jpeg';
            resolve({ buffer, mimeType: contentType.split(';')[0].trim() });
          });
        }).on('error', reject);
      };
      makeRequest(imageUrl);
    });
  }

  static async compressImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      if (buffer.length <= COMPRESSED_MAX_BYTES && metadata.width <= COMPRESS_WIDTH) {
        return { buffer, mimeType: metadata.format ? `image/${metadata.format}` : 'image/jpeg' };
      }

      let pipeline = sharp(buffer).resize({
        width: Math.min(metadata.width || COMPRESS_WIDTH, COMPRESS_WIDTH),
        withoutEnlargement: true,
        fit: 'inside',
      });

      const format = metadata.format || 'jpeg';
      if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ quality: COMPRESS_QUALITY, mozjpeg: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality: COMPRESS_QUALITY, compressionLevel: 8 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality: COMPRESS_QUALITY });
      } else {
        pipeline = pipeline.jpeg({ quality: COMPRESS_QUALITY });
      }

      const compressed = await pipeline.toBuffer();
      logger.info('[ImageProcessor] Image compressed', {
        originalSize: buffer.length,
        compressedSize: compressed.length,
        reduction: `${Math.round((1 - compressed.length / buffer.length) * 100)}%`,
      });

      return { buffer: compressed, mimeType: 'image/jpeg' };
    } catch (error) {
      logger.warn('[ImageProcessor] Compression failed, using original', { error: error.message });
      return { buffer, mimeType: 'image/jpeg' };
    }
  }

  static hashImage(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  static async processImage(imageUrl) {
    const { buffer, mimeType } = await this.fetchImage(imageUrl);
    const hash = this.hashImage(buffer);
    const { buffer: compressedBuffer } = await this.compressImage(buffer);

    return {
      originalBuffer: buffer,
      compressedBuffer,
      hash,
      mimeType,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
    };
  }
}

module.exports = ImageProcessor;
