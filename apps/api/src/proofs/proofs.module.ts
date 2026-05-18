import { Module } from '@nestjs/common';
import { ProofsController } from './proofs.controller';
import { ProofsV1Controller } from './proofs.controller';
import { ProofsService } from './proofs.service';

@Module({
  controllers: [ProofsController, ProofsV1Controller],
  providers: [ProofsService],
  exports: [ProofsService],
})
export class ProofsModule {}
