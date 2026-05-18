import { SetMetadata } from '@nestjs/common';

export const IS_OWNER_KEY = 'is_owner';
export const IsOwner = (isOwner = true) => SetMetadata(IS_OWNER_KEY, isOwner);
