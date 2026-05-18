import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliverySlotsService } from './delivery-slots.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { CreateSlotDto } from './dto/create-slot.dto';
import { BulkCreateSlotsDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@ApiTags('delivery-slots')
@Controller({ path: 'shop/delivery-slots', version: '1' })
export class DeliverySlotsController {
  private readonly logger = new Logger(DeliverySlotsController.name);

  constructor(private readonly deliverySlotsService: DeliverySlotsService) {}

  @Get()
  @IsPublic()
  @ApiOperation({ summary: 'List available delivery slots' })
  @ApiQuery({ name: 'timezone', required: false, example: 'America/New_York' })
  @ApiResponse({ status: 200, description: 'Available delivery slots' })
  async getAvailableSlots(@Query('timezone') timezone?: string) {
    return this.deliverySlotsService.findAvailable(timezone);
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all slots for management (owner)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'All delivery slots' })
  async getAllSlots(@Query('includeInactive') includeInactive?: boolean) {
    return this.deliverySlotsService.findAll(includeInactive);
  }

  @Get('availability')
  @IsPublic()
  @ApiOperation({ summary: 'Get slot availability summary' })
  @ApiResponse({ status: 200, description: 'Availability data' })
  async getAvailability() {
    return this.deliverySlotsService.getAvailabilitySummary();
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Get single slot details' })
  @ApiResponse({ status: 200, description: 'Slot details' })
  async getSlot(@Param('id') id: string) {
    return this.deliverySlotsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a single delivery slot' })
  @ApiResponse({ status: 201, description: 'Slot created' })
  async createSlot(@Body() dto: CreateSlotDto) {
    return this.deliverySlotsService.create(dto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk create delivery slots' })
  @ApiResponse({ status: 201, description: 'Slots created' })
  async bulkCreateSlots(@Body() dto: BulkCreateSlotsDto) {
    return this.deliverySlotsService.bulkCreate(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update delivery slot' })
  @ApiResponse({ status: 200, description: 'Slot updated' })
  async updateSlot(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.deliverySlotsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle slot active state' })
  @ApiResponse({ status: 200, description: 'Slot toggled' })
  async toggleSlot(@Param('id') id: string) {
    return this.deliverySlotsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete delivery slot' })
  @ApiResponse({ status: 200, description: 'Slot deleted' })
  async deleteSlot(@Param('id') id: string) {
    return this.deliverySlotsService.delete(id);
  }
}
