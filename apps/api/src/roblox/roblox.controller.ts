import {
  Controller,
  Get,
  Param,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { MediaService } from '../media/media.service';

@ApiTags('roblox')
@Controller('shop/roblox')
export class RobloxController {
  private readonly logger = new Logger(RobloxController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Get('search')
  @IsPublic()
  @ApiOperation({ summary: 'Search Roblox username' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchUser(@Param('username') username: string) {
    return this.mediaService.searchRobloxUser(username);
  }

  @Get('user/:username')
  @IsPublic()
  @ApiOperation({ summary: 'Get Roblox user by username' })
  @ApiResponse({ status: 200, description: 'User data' })
  async getUserByUsername(@Param('username') username: string) {
    return this.mediaService.getRobloxUserByUsername(username);
  }
}
