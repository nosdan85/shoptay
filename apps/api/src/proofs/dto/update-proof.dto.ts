import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProofStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateProofDto {
  @ApiProperty({
    description: 'Proof status',
    enum: ProofStatus,
  })
  @IsEnum(ProofStatus)
  status: ProofStatus;
}
