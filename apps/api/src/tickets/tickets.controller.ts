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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { IsPublic } from '../common/decorators/is-public.decorator';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUserId() userId?: string,
  ) {
    // For now, we'll use a header for Discord ID since the auth might not have it
    // In production, this would come from the Discord OAuth integration
    const discordId = userId || 'anonymous';
    const discordUsername = 'Anonymous User';

    return this.ticketsService.createTicket(dto, discordId, discordUsername);
  }

  @Get('channel/:channelId')
  @IsPublic()
  @ApiOperation({ summary: 'Get ticket by channel ID' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketByChannelId(@Param('channelId') channelId: string) {
    return this.ticketsService.getTicketByChannelId(channelId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiResponse({ status: 200, description: 'User tickets' })
  async getMyTickets(
    @CurrentUserId() userId: string,
    @Query() query: TicketQueryDto,
  ) {
    return this.ticketsService.getTicketsByUser(userId, query);
  }

  @Get(':ticketId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(
    @Param('ticketId') ticketId: string,
    @CurrentUserId() userId?: string,
  ) {
    return this.ticketsService.getTicketById(ticketId);
  }

  @Post(':ticketId/messages')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send message to ticket' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async sendMessage(
    @Param('ticketId') ticketId: string,
    @Body() dto: SendMessageDto,
    @CurrentUserId() userId?: string,
  ) {
    // Determine author type based on auth status
    const authorId = userId || 'anonymous';
    const authorType = userId ? 'customer' : 'bot';

    return this.ticketsService.sendMessage(ticketId, dto, authorId, authorType);
  }

  @Patch(':ticketId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicket(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(ticketId, dto);
  }

  @Post(':ticketId/close')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close ticket' })
  @ApiResponse({ status: 200, description: 'Ticket closed' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async closeTicket(@Param('ticketId') ticketId: string) {
    return this.ticketsService.closeTicket(ticketId);
  }

  @Post(':ticketId/resolve')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve ticket' })
  @ApiResponse({ status: 200, description: 'Ticket resolved' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async resolveTicket(@Param('ticketId') ticketId: string) {
    return this.ticketsService.resolveTicket(ticketId);
  }

  // Owner-only endpoints
  @Get('owner/all')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets (owner only)' })
  @ApiResponse({ status: 200, description: 'All tickets' })
  async getAllTickets(@Query() query: TicketQueryDto) {
    return this.ticketsService.getAllTickets(query);
  }

  @Get('owner/stats')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket statistics (owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket statistics' })
  async getTicketStats() {
    return this.ticketsService.getTicketStats();
  }

  @Get('owner/:id')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID (owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketByIdOwner(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Post(':ticketId/messages/staff')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send staff message to ticket' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendStaffMessage(
    @Param('ticketId') ticketId: string,
    @Body() dto: SendMessageDto,
    @CurrentUserId() staffId: string,
  ) {
    return this.ticketsService.sendMessage(ticketId, dto, staffId, 'staff');
  }

  @Delete(':ticketId')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete ticket (owner only)' })
  @ApiResponse({ status: 200, description: 'Ticket deleted' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async deleteTicket(
    @Param('ticketId') ticketId: string,
    @CurrentUserId() adminId: string,
  ) {
    return this.ticketsService.deleteTicket(ticketId, adminId);
  }
}
