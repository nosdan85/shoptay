import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTicketDto, TicketStatusEnum } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly discordBotToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.discordBotToken = this.configService.get<string>('app.discord.botToken') || '';
  }

  async createTicket(
    dto: CreateTicketDto,
    discordId: string,
    discordUsername: string,
  ) {
    // If orderId provided, verify ownership
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.discordId !== discordId) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        channelId: `temp_${Date.now()}`,
        discordId,
        discordUsername,
        orderId: dto.orderId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        status: TicketStatusEnum.OPEN,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            items: {
              select: {
                name: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Ticket ${ticket.id} created for user ${discordId}`);

    return {
      ticket,
      channelId: ticket.channelId,
    };
  }

  async getTicketByChannelId(channelId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { channelId },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            items: {
              select: {
                name: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async getTicketById(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            items: {
              select: {
                name: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async getTicketsByUser(discordId: string, query: TicketQueryDto) {
    const { page = 1, limit = 20, status, type, priority, search } = query;

    const where: any = { discordId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { discordUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTickets(query: TicketQueryDto) {
    const { page = 1, limit = 20, status, type, priority, search } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { discordUsername: { contains: search, mode: 'insensitive' } },
        { channelId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(
    ticketId: string,
    dto: SendMessageDto,
    authorId: string,
    authorType: 'customer' | 'staff' | 'bot',
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Verify the user can send messages to this ticket
    if (authorType === 'customer' && ticket.discordId !== authorId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId,
        authorType,
        content: dto.content,
        attachments: dto.attachments || [],
      },
    });

    // Update ticket's updatedAt
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async updateTicket(ticketId: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
    }

    if (dto.priority) {
      updateData.priority = dto.priority;
    }

    if (dto.subject !== undefined) {
      updateData.subject = dto.subject;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    this.logger.log(`Ticket ${ticketId} updated`);

    return updated;
  }

  async closeTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatusEnum.CLOSED,
        closedAt: new Date(),
      },
    });

    this.logger.log(`Ticket ${ticketId} closed`);

    return updated;
  }

  async resolveTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatusEnum.RESOLVED,
        closedAt: new Date(),
      },
    });

    this.logger.log(`Ticket ${ticketId} resolved`);

    return updated;
  }

  async deleteTicket(ticketId: string, adminId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Delete Discord channel if exists
    if (ticket.channelId && !ticket.channelId.startsWith('temp_') && this.discordBotToken) {
      try {
        const axios = (await import('axios')).default;
        await axios.delete(
          `https://discord.com/api/v10/channels/${ticket.channelId}`,
          {
            headers: {
              Authorization: `Bot ${this.discordBotToken}`,
            },
          },
        );
      } catch (error) {
        this.logger.warn(`Failed to delete Discord channel ${ticket.channelId}: ${error}`);
      }
    }

    await this.prisma.ticket.delete({
      where: { id: ticketId },
    });

    this.logger.log(`Ticket ${ticketId} deleted by admin ${adminId}`);

    return { success: true };
  }

  async getTicketStats() {
    const [open, pending, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where: { status: TicketStatusEnum.OPEN } }),
      this.prisma.ticket.count({ where: { status: TicketStatusEnum.PENDING } }),
      this.prisma.ticket.count({ where: { status: TicketStatusEnum.RESOLVED } }),
      this.prisma.ticket.count({ where: { status: TicketStatusEnum.CLOSED } }),
    ]);

    return { open, pending, resolved, closed };
  }

  async updateChannelId(ticketId: string, channelId: string, channelName?: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        channelId,
        channelName,
      },
    });
  }
}
