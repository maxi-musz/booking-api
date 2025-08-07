import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Booking } from '../../generated/prisma';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InputUtils } from '../common/utils/input.utils';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(page = 1, limit = 10): Promise<Booking[]> {
    this.logger.log(`Fetching bookings with page: ${page}, limit: ${limit}`);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      );
    }

    try {
      const bookings = await this.prismaService.booking.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: true,
        },
        orderBy: {
          id: 'desc',
        },
      });

      this.logger.log(`Successfully fetched ${bookings.length} bookings`);
      return bookings;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch bookings: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Booking> {
    this.logger.log(`Fetching booking with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid booking ID. Must be a positive number.',
      );
    }

    try {
      const booking = await this.prismaService.booking.findUnique({
        where: { id },
        include: {
          property: true,
        },
      });

      if (!booking) {
        this.logger.warn(`Booking with ID ${id} not found`);
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      this.logger.log(`Successfully fetched booking with ID: ${id}`);
      return booking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch booking with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    this.logger.log('Creating new booking');

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(createBookingDto);

    // Validate dates
    if (
      !InputUtils.isValidDateRange(trimmedDto.startDate, trimmedDto.endDate)
    ) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check if start date is in the future
    if (!InputUtils.isFutureDate(trimmedDto.startDate)) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Check if property exists
    const property = await this.prismaService.property.findUnique({
      where: { id: trimmedDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Property with ID ${trimmedDto.propertyId} not found`,
      );
    }

    // Check if property is available for the requested dates
    const isAvailable = await this.checkPropertyAvailability(
      trimmedDto.propertyId,
      trimmedDto.startDate,
      trimmedDto.endDate,
    );

    if (!isAvailable) {
      throw new ConflictException(
        'Property is not available for the requested dates',
      );
    }

    try {
      const booking = await this.prismaService.booking.create({
        data: {
          propertyId: trimmedDto.propertyId,
          userName: trimmedDto.userName,
          startDate: new Date(trimmedDto.startDate),
          endDate: new Date(trimmedDto.endDate),
        },
        include: {
          property: true,
        },
      });

      this.logger.log(`Successfully created booking with ID: ${booking.id}`);
      return booking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create booking: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    this.logger.log(`Updating booking with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid booking ID. Must be a positive number.',
      );
    }

    // Check if booking exists
    const existingBooking = await this.findOne(id);

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(updateBookingDto);

    // Validate dates if both are provided
    if (trimmedDto.startDate && trimmedDto.endDate) {
      if (
        !InputUtils.isValidDateRange(trimmedDto.startDate, trimmedDto.endDate)
      ) {
        throw new BadRequestException('Start date must be before end date');
      }
    } else if (trimmedDto.startDate) {
      // If only startDate is provided, check against existing endDate
      if (
        !InputUtils.isValidDateRange(
          trimmedDto.startDate,
          existingBooking.endDate,
        )
      ) {
        throw new BadRequestException(
          'Start date must be before existing end date',
        );
      }
    } else if (trimmedDto.endDate) {
      // If only endDate is provided, check against existing startDate
      if (
        !InputUtils.isValidDateRange(
          existingBooking.startDate,
          trimmedDto.endDate,
        )
      ) {
        throw new BadRequestException(
          'End date must be after existing start date',
        );
      }
    }

    // Check if start date is in the future if provided
    if (
      trimmedDto.startDate &&
      !InputUtils.isFutureDate(trimmedDto.startDate)
    ) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Check property availability if dates or property are being updated
    if (trimmedDto.startDate || trimmedDto.endDate || trimmedDto.propertyId) {
      const propertyId = trimmedDto.propertyId || existingBooking.propertyId;
      const startDate = trimmedDto.startDate || existingBooking.startDate;
      const endDate = trimmedDto.endDate || existingBooking.endDate;

      const isAvailable = await this.checkPropertyAvailability(
        propertyId,
        startDate,
        endDate,
        id, // Exclude current booking from availability check
      );

      if (!isAvailable) {
        throw new ConflictException(
          'Property is not available for the requested dates',
        );
      }
    }

    try {
      const updatedBooking = await this.prismaService.booking.update({
        where: { id },
        data: {
          ...(trimmedDto.propertyId && { propertyId: trimmedDto.propertyId }),
          ...(trimmedDto.userName && { userName: trimmedDto.userName }),
          ...(trimmedDto.startDate && {
            startDate: new Date(trimmedDto.startDate),
          }),
          ...(trimmedDto.endDate && { endDate: new Date(trimmedDto.endDate) }),
        },
        include: {
          property: true,
        },
      });

      this.logger.log(`Successfully updated booking with ID: ${id}`);
      return updatedBooking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update booking with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async remove(id: number): Promise<Booking> {
    this.logger.log(`Deleting booking with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid booking ID. Must be a positive number.',
      );
    }

    // Check if booking exists
    await this.findOne(id);

    try {
      const deletedBooking = await this.prismaService.booking.delete({
        where: { id },
        include: {
          property: true,
        },
      });

      this.logger.log(`Successfully deleted booking with ID: ${id}`);
      return deletedBooking;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete booking with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  private async checkPropertyAvailability(
    propertyId: number,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: number,
  ): Promise<boolean> {
    const conflictingBookings = await this.prismaService.booking.findMany({
      where: {
        propertyId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          {
            startDate: { lte: new Date(startDate) },
            endDate: { gt: new Date(startDate) },
          },
          {
            startDate: { lt: new Date(endDate) },
            endDate: { gte: new Date(endDate) },
          },
          {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
          },
        ],
      },
    });

    return conflictingBookings.length === 0;
  }
}
