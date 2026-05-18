import { Module } from '@nestjs/common';
import { RobloxController } from './roblox.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [RobloxController],
})
export class RobloxModule {}
