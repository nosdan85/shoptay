import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
