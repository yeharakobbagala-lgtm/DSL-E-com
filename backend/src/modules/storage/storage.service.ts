import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharpModule from 'sharp';
const getSharp = (): any => (sharpModule as any).default || sharpModule;
import { StorageDriver, StoredFile } from './storage.interface';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { DigitalOceanStorageDriver } from './drivers/digitalocean-storage.driver';

@Injectable()
export class StorageService implements StorageDriver {
  private readonly logger = new Logger(StorageService.name);
  private readonly activeDriver: StorageDriver;
  private readonly driverType: string;

  constructor(
    @Inject(LocalStorageDriver) private readonly localDriver: LocalStorageDriver,
    @Inject(DigitalOceanStorageDriver) private readonly doDriver: DigitalOceanStorageDriver,
    @Optional() @Inject(ConfigService) private readonly configService?: ConfigService
  ) {
    this.driverType = this.configService?.get<string>('STORAGE_DRIVER', 'local') || 'local';

    const hasDoKeys = !!(
      this.configService?.get<string>('DO_SPACES_KEY') &&
      this.configService?.get<string>('DO_SPACES_SECRET')
    );

    if (this.driverType === 'digitalocean' && hasDoKeys) {
      this.activeDriver = this.doDriver;
      this.logger.log('Active storage driver: DigitalOcean Spaces (S3 compatible - dartcodes.data/dsl)');
    } else if (this.driverType === 'digitalocean' && !hasDoKeys) {
      this.logger.warn('DigitalOcean driver requested but keys are missing. Falling back to LocalStorageDriver.');
      this.activeDriver = this.localDriver;
    } else {
      this.activeDriver = this.localDriver;
      this.logger.log('Active storage driver: LocalStorageDriver (public/uploads)');
    }
  }

  /**
   * Automatic In-Memory WebP Image Pipeline
   * Intercepts raster images (PNG, JPEG) and converts them to high-efficiency WebP (quality: 80).
   * Videos, PDFs, and SVGs are safely passed through untouched.
   */
  private async processImageToWebp(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!file || !file.buffer) {
      return file;
    }

    const mime = (file.mimetype || '').toLowerCase();
    const originalName = file.originalname || 'upload';
    const isRasterImage =
      ['image/jpeg', 'image/png', 'image/jpg'].includes(mime) ||
      /\.(jpe?g|png)$/i.test(originalName);

    // If it's a video, SVG, PDF, or GIF, pass through untouched
    if (!isRasterImage) {
      return file;
    }

    try {
      const originalBytes = file.buffer.length;
      const sharp = getSharp();
      const webpBuffer = await sharp(file.buffer)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const baseName = originalName.replace(/\.(jpe?g|png)$/i, '');
      const newFileName = `${baseName}.webp`;

      const savingsPct = (((originalBytes - webpBuffer.length) / originalBytes) * 100).toFixed(1);
      this.logger.log(
        `Auto-converted image "${originalName}" to WebP: ${(originalBytes / 1024).toFixed(1)} KB -> ${(webpBuffer.length / 1024).toFixed(1)} KB (-${savingsPct}%)`
      );

      return {
        ...file,
        buffer: webpBuffer,
        size: webpBuffer.length,
        mimetype: 'image/webp',
        originalname: newFileName,
      };
    } catch (err: any) {
      this.logger.warn(
        `WebP conversion failed for "${originalName}", uploading original format: ${err.message}`
      );
      return file;
    }
  }

  async upload(file: Express.Multer.File, folder = 'general'): Promise<StoredFile> {
    // Run automatic WebP conversion first
    const processedFile = await this.processImageToWebp(file);
    try {
      return await this.activeDriver.upload(processedFile, folder);
    } catch (driverErr: any) {
      if (this.activeDriver !== this.localDriver) {
        this.logger.warn(
          `Primary driver upload failed (${driverErr?.message}). Gracefully falling back to LocalStorageDriver.`
        );
        return await this.localDriver.upload(processedFile, folder);
      }
      throw driverErr;
    }
  }

  async delete(filePath: string): Promise<void> {
    return this.activeDriver.delete(filePath);
  }

  getPublicUrl(filePath: string): string {
    return this.activeDriver.getPublicUrl(filePath);
  }
}
