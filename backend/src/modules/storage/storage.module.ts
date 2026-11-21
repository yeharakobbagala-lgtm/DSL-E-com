import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { DigitalOceanStorageDriver } from './drivers/digitalocean-storage.driver';

@Module({
  imports: [ConfigModule],
  providers: [LocalStorageDriver, DigitalOceanStorageDriver, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
