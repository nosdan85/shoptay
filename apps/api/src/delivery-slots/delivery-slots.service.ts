import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { convertToTimezone } from '../common/utils/helpers';

@Injectable()
export class DeliverySlotsService {
  private readonly logger = new Logger(DeliverySlotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAvailable(timezone?: string): Promise<{
    slots: Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      ownerTimezone: string;
      note?: string;
      maxOrders: number;
      currentOrders: number;
      availableSpots: number;
      isFull: boolean;
      localStartAt: Date;
      localEndAt: Date;
      localDate: string;
    }>;
    groupedByDate: Record<string, any[]>;
    timezone: string;
  }> {
    const now = new Date();
    const targetTimezone = timezone || 'UTC';

    const slots = await this.prisma.deliverySlot.findMany({
      where: {
        isActive: true,
        startAt: {
          gte: now,
        },
      },
      orderBy: [{ startAt: 'asc' }],
    });

    const convertedSlots = slots.map((slot) => {
      const localStartAt = convertToTimezone(slot.startAt, targetTimezone);
      const localEndAt = convertToTimezone(slot.endAt, targetTimezone);

      return {
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        ownerTimezone: slot.ownerTimezone,
        note: slot.note,
        maxOrders: slot.maxOrders,
        currentOrders: slot.currentOrders,
        availableSpots: slot.maxOrders - slot.currentOrders,
        isFull: slot.currentOrders >= slot.maxOrders,
        localStartAt,
        localEndAt,
        localDate: localStartAt.toISOString().split('T')[0],
      };
    });

    const groupedByDate = convertedSlots.reduce((acc, slot) => {
      const dateKey = slot.localDate;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(slot);
      return acc;
    }, {} as Record<string, typeof convertedSlots>);

    return {
      slots: convertedSlots,
      groupedByDate,
      timezone: targetTimezone,
    };
  }

  async findAll(includeInactive = false): Promise<{
    data: Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      ownerTimezone: string;
      note?: string;
      maxOrders: number;
      currentOrders: number;
      isActive: boolean;
      createdAt: Date;
    }>;
  }> {
    const slots = await this.prisma.deliverySlot.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ startAt: 'asc' }],
    });

    return {
      data: slots.map((slot) => ({
        id: slot.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
        ownerTimezone: slot.ownerTimezone,
        note: slot.note,
        maxOrders: slot.maxOrders,
        currentOrders: slot.currentOrders,
        isActive: slot.isActive,
        createdAt: slot.createdAt,
      })),
    };
  }

  async findOne(id: string): Promise<{
    id: string;
    startAt: Date;
    endAt: Date;
    ownerTimezone: string;
    note?: string;
    maxOrders: number;
    currentOrders: number;
    isActive: boolean;
    createdAt: Date;
  }> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    return {
      id: slot.id,
      startAt: slot.startAt,
      endAt: slot.endAt,
      ownerTimezone: slot.ownerTimezone,
      note: slot.note,
      maxOrders: slot.maxOrders,
      currentOrders: slot.currentOrders,
      isActive: slot.isActive,
      createdAt: slot.createdAt,
    };
  }

  async bulkCreate(dto: {
    slots: Array<{
      startAt: string;
      endAt: string;
      note?: string;
    }>;
    ownerTimezone?: string;
  }): Promise<{
    success: boolean;
    created: number;
    slots: Array<{
      id: string;
      startAt: Date;
      endAt: Date;
      ownerTimezone: string;
    }>;
  }> {
    if (!dto.slots || dto.slots.length === 0) {
      throw new BadRequestException('No slots provided');
    }

    if (dto.slots.length > 100) {
      throw new BadRequestException('Maximum 100 slots per bulk create');
    }

    const timezone = dto.ownerTimezone || 'UTC';

    const createdSlots = await this.prisma.$transaction(
      dto.slots.map((slot) => {
        const startAt = new Date(slot.startAt);
        const endAt = new Date(slot.endAt);

        if (startAt >= endAt) {
          throw new BadRequestException('Start time must be before end time');
        }

        return this.prisma.deliverySlot.create({
          data: {
            startAt,
            endAt,
            ownerTimezone: timezone,
            note: slot.note,
            maxOrders: 10,
            currentOrders: 0,
            isActive: true,
          },
        });
      }),
    );

    this.logger.log(`Created ${createdSlots.length} delivery slots`);

    return {
      success: true,
      created: createdSlots.length,
      slots: createdSlots.map((s) => ({
        id: s.id,
        startAt: s.startAt,
        endAt: s.endAt,
        ownerTimezone: s.ownerTimezone,
      })),
    };
  }

  async create(dto: {
    startAt: string;
    endAt: string;
    ownerTimezone?: string;
    note?: string;
    maxOrders?: number;
  }): Promise<{
    id: string;
    startAt: Date;
    endAt: Date;
    ownerTimezone: string;
    note?: string;
    maxOrders: number;
    currentOrders: number;
    isActive: boolean;
  }> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (startAt >= endAt) {
      throw new BadRequestException('Start time must be before end time');
    }

    const slot = await this.prisma.deliverySlot.create({
      data: {
        startAt,
        endAt,
        ownerTimezone: dto.ownerTimezone || 'UTC',
        note: dto.note,
        maxOrders: dto.maxOrders || 10,
        currentOrders: 0,
        isActive: true,
      },
    });

    this.logger.log(`Created delivery slot ${slot.id}`);

    return {
      id: slot.id,
      startAt: slot.startAt,
      endAt: slot.endAt,
      ownerTimezone: slot.ownerTimezone,
      note: slot.note,
      maxOrders: slot.maxOrders,
      currentOrders: slot.currentOrders,
      isActive: slot.isActive,
    };
  }

  async update(
    id: string,
    dto: {
      startAt?: string;
      endAt?: string;
      ownerTimezone?: string;
      note?: string;
      maxOrders?: number;
      isActive?: boolean;
    },
  ): Promise<{
    id: string;
    startAt: Date;
    endAt: Date;
    ownerTimezone: string;
    note?: string;
    maxOrders: number;
    currentOrders: number;
    isActive: boolean;
  }> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    if (dto.maxOrders !== undefined && dto.maxOrders < slot.currentOrders) {
      throw new BadRequestException(
        `Cannot reduce max orders below current orders (${slot.currentOrders})`,
      );
    }

    const updateData: any = {};

    if (dto.startAt) {
      updateData.startAt = new Date(dto.startAt);
    }
    if (dto.endAt) {
      updateData.endAt = new Date(dto.endAt);
    }
    if (dto.ownerTimezone !== undefined) {
      updateData.ownerTimezone = dto.ownerTimezone;
    }
    if (dto.note !== undefined) {
      updateData.note = dto.note;
    }
    if (dto.maxOrders !== undefined) {
      updateData.maxOrders = dto.maxOrders;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const updated = await this.prisma.deliverySlot.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Delivery slot ${id} updated`);

    return {
      id: updated.id,
      startAt: updated.startAt,
      endAt: updated.endAt,
      ownerTimezone: updated.ownerTimezone,
      note: updated.note,
      maxOrders: updated.maxOrders,
      currentOrders: updated.currentOrders,
      isActive: updated.isActive,
    };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    if (slot._count.orders > 0) {
      throw new BadRequestException('Cannot delete slot with existing orders');
    }

    await this.prisma.deliverySlot.delete({
      where: { id },
    });

    this.logger.log(`Delivery slot ${id} deleted`);

    return { success: true };
  }

  async toggleActive(id: string): Promise<{
    id: string;
    isActive: boolean;
  }> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    const updated = await this.prisma.deliverySlot.update({
      where: { id },
      data: { isActive: !slot.isActive },
    });

    this.logger.log(`Delivery slot ${id} toggled to ${updated.isActive}`);

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }

  async reserveSlot(slotId: string): Promise<void> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    if (!slot.isActive) {
      throw new BadRequestException('Delivery slot is not active');
    }

    if (slot.currentOrders >= slot.maxOrders) {
      throw new BadRequestException('Delivery slot is full');
    }

    await this.prisma.deliverySlot.update({
      where: { id: slotId },
      data: {
        currentOrders: { increment: 1 },
      },
    });
  }

  async releaseSlot(slotId: string): Promise<void> {
    const slot = await this.prisma.deliverySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('Delivery slot not found');
    }

    if (slot.currentOrders > 0) {
      await this.prisma.deliverySlot.update({
        where: { id: slotId },
        data: {
          currentOrders: { decrement: 1 },
        },
      });
    }
  }

  async getAvailabilitySummary(): Promise<{
    availability: Array<{
      date: string;
      totalSlots: number;
      bookedSlots: number;
      availableSlots: number;
      noSlots?: boolean;
    }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = await this.prisma.deliverySlot.findMany({
      where: {
        isActive: true,
        startAt: { gte: today },
      },
      orderBy: [{ startAt: 'asc' }],
    });

    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const availability = slots.reduce((acc, slot) => {
      const dateKey = slot.startAt.toISOString().split('T')[0];
      const existing = acc.find((a) => a.date === dateKey);

      if (existing) {
        existing.totalSlots += slot.maxOrders;
        existing.bookedSlots += slot.currentOrders;
        existing.availableSlots += slot.maxOrders - slot.currentOrders;
      } else {
        acc.push({
          date: dateKey,
          totalSlots: slot.maxOrders,
          bookedSlots: slot.currentOrders,
          availableSlots: slot.maxOrders - slot.currentOrders,
        });
      }

      return acc;
    }, [] as Array<{
      date: string;
      totalSlots: number;
      bookedSlots: number;
      availableSlots: number;
    }>);

    const result = next7Days.map((date) => {
      const existing = availability.find((a) => a.date === date);
      return existing || {
        date,
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
        noSlots: true,
      };
    });

    return { availability: result };
  }
}
