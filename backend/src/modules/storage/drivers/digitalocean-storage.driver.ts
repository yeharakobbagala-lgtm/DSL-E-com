import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as path from 'path';
import { StorageDriver, StoredFile } from '../storage.interface';

@Injectable()
export class DigitalOceanStorageDriver implements StorageDriver {
  private readonly logger = new Logger(DigitalOceanStorageDriver.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT') || 'https://sgp1.digitaloceanspaces.com';
    const region = this.configService.get<string>('DO_SPACES_REGION') || 'sgp1';
    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY', '');
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET', '');

    this.bucket = this.configService.get<string>('DO_SPACES_BUCKET') || 'dartcodes.data';
    this.prefix = this.configService.get<string>('DO_SPACES_PREFIX') || 'dsl';
    
    // For buckets containing dots, path-style URL is required to avoid TLS certificate mismatch
    const fallbackPublicUrl = `https://${region}.digitaloceanspaces.com/${this.bucket}`;
    this.publicBaseUrl = this.configService.get<string>('DO_SPACES_PUBLIC_URL') || fallbackPublicUrl;

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.logger.log(`Initialized DigitalOceanStorageDriver on bucket "${this.bucket}" (prefix: "${this.prefix}")`);
  }

  private getSafeExtension(originalName: string, mimeType: string): string {
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      const ext = extMatch[1].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'pdf', 'svg', 'mp4', 'webm', 'mov', 'ogg', 'm4v', 'gif'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    }

    switch (mimeType) {
      case 'image/webp':
        return 'webp';
      case 'image/png':
        return 'png';
      case 'image/jpeg':
        return 'jpg';
      case 'image/svg+xml':
        return 'svg';
      case 'image/gif':
        return 'gif';
      case 'video/mp4':
      case 'video/quicktime':
      case 'video/x-m4v':
        return 'mp4';
      case 'video/webm':
        return 'webm';
      case 'video/ogg':
        return 'ogg';
      case 'application/pdf':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  async upload(file: Express.Multer.File, folder = 'general'): Promise<StoredFile> {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const ext = this.getSafeExtension(file.originalname, file.mimetype);
    const safeFileName = `${crypto.randomUUID()}.${ext}`;
    
    // Key format: dsl/<folder>/<uuid>.<ext>
    const key = `${this.prefix}/${cleanFolder}/${safeFileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype || 'application/octet-stream',
        })
      );

      const publicUrl = `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
      this.logger.log(`Uploaded file to DigitalOcean Spaces: ${publicUrl} (${file.size} bytes)`);

      return {
        url: publicUrl,
        path: key,
        filename: safeFileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      };
    } catch (err: any) {
      this.logger.error(`Failed to upload file to DigitalOcean Spaces: ${err.message}`, err.stack);
      throw new BadRequestException(`Cloud storage upload failed: ${err.message}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    if (!filePath) return;

    // Extract the S3 key if a full URL was provided
    let key = filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        const urlObj = new URL(filePath);
        // pathname format could be /dartcodes.data/dsl/... or /dsl/...
        let pathname = urlObj.pathname.replace(/^\/+/, '');
        if (pathname.startsWith(`${this.bucket}/`)) {
          pathname = pathname.substring(this.bucket.length + 1);
        }
        key = pathname;
      } catch {
        // Keep original
      }
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      this.logger.log(`Deleted file from DigitalOcean Spaces: ${key}`);
    } catch (err: any) {
      this.logger.warn(`Failed to delete file from DigitalOcean Spaces (${key}): ${err.message}`);
    }
  }

  getPublicUrl(filePath: string): string {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const cleanPath = filePath.replace(/^\/+/, '');
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${cleanPath}`;
  }
}
