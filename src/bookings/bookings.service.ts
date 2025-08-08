import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Booking } from '../../generated/prisma';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InputUtils } from '../common/utils/input.utils';
import { ResponseHelper } from 'src/shared';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(page = 1, limit = 10, status?: string): Promise<any> {
    this.logger.log(`Fetching bookings with page: ${page}, limit: ${limit}, status: ${status}`);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      );
    }

    // Build filter
    const where: any = {};
    if (status) {
      where.status = status;
    }
    // Add more filters as needed (e.g., date range, propertyId)

    try {
      const [bookings, totalItems] = await Promise.all([
        this.prismaService.booking.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: { property: true },
          orderBy: { id: 'desc' },
        }),
        this.prismaService.booking.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);
      const hasMore = page < totalPages;

      const formattedResponse = bookings.map((booking) => ({
        id: booking.id,
        propertyId: booking.propertyId,
        userName: booking.userName,
        startDate: booking.startDate.toISOString().slice(0, 10),
        endDate: booking.endDate.toISOString().slice(0, 10),
        status: booking.status,
        property: booking.property,
      }));

      this.logger.log(`Successfully fetched ${bookings.length} bookings`);
      return {
        success: true,
        message: 'Bookings retrieved successfully',
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasMore,
        length: bookings.length,
        data: formattedResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch bookings', error.stack);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const count = await this.prismaService.booking.count();
      return count;
    } catch (error) {
      this.logger.error('Failed to count bookings', error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(`Fetching booking with ID: ${id}`);

    try {
      const booking = await this.prismaService.booking.findUnique({
        where: { id },
        include: {
          property: true,
        },
      });

      if (!booking) {
        this.logger.warn(`Booking with ID ${id} not found`);
        return ResponseHelper.error(
          "Failed to delete a booking"
        )
      }

      return {
        success: true,
        message: 'Booking retrieved successfully',
        data: booking,
      };
    } catch (error) {
      this.logger.error('Failed to fetch booking', error.stack);
      throw error;
    }
  }

  async create(createBookingDto: CreateBookingDto) {
    this.logger.log('Creating new booking', createBookingDto);

    // 1. Sanitize and Parse Input
    const trimmedDto = InputUtils.trimObject(createBookingDto);
    const startDateObj = InputUtils.parseDate(trimmedDto.startDate);
    const endDateObj = InputUtils.parseDate(trimmedDto.endDate);

    // 2. Basic Date Validations
    if (!InputUtils.isValidDateRange(startDateObj, endDateObj)) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (!InputUtils.isFutureDate(startDateObj)) {
      throw new BadRequestException('Start date must be in the future');
    }

    // 3. Ensure Property Exists
    const property = await this.prismaService.property.findUnique({
      where: { id: trimmedDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${trimmedDto.propertyId} not found`);
    }

    // 4. Validate Date Range Falls Within Property Availability
    if (
      startDateObj < property.availableFrom ||
      endDateObj > property.availableTo
    ) {
      throw new BadRequestException(
        `Booking dates must be within the property's availability range: ${property.availableFrom.toDateString()} to ${property.availableTo.toDateString()}`
      );
    }

    // 5. I Check for Overlapping Bookings Here
    const overlappingBookings = await this.prismaService.booking.findMany({
      where: {
        propertyId: trimmedDto.propertyId,
        NOT: [
          { endDate: { lte: startDateObj } },
          { startDate: { gte: endDateObj } },
        ],
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    if (overlappingBookings.length > 0) {
      const overlaps = overlappingBookings.map(b => ({
        startDate: b.startDate.toISOString().slice(0, 10),
        endDate: b.endDate.toISOString().slice(0, 10),
      }));
      throw new ConflictException({
        message: 'Booking dates overlap with existing bookings',
        overlaps,
        requested: {
          startDate: startDateObj.toISOString().slice(0, 10),
          endDate: endDateObj.toISOString().slice(0, 10),
        }
      });
    }

    // 6. Create Booking
    try {
      const booking = await this.prismaService.booking.create({
        data: {
          propertyId: trimmedDto.propertyId,
          userName: trimmedDto.userName,
          startDate: startDateObj,
          endDate: endDateObj,
        },
        include: {
          property: true,
        },
      });

      const formattedBooking = {
        id: booking.id,
        propertyId: booking.propertyId,
        userName: booking.userName,
        startDate: booking.startDate.toISOString().slice(0, 10),
        endDate: booking.endDate.toISOString().slice(0, 10),
        property: booking.property,
      };

      return ResponseHelper.success('Booking created successfully', formattedBooking);
    } catch (error) {
      this.logger.error('Failed to create booking', error.stack);
      throw new InternalServerErrorException('An error occurred while creating the booking');
    }
  }


  async update(id: string, updateBookingDto: UpdateBookingDto) {
    this.logger.log(`Updating booking with ID: ${id}`);

    // Check if booking exists
    await this.findOne(id);

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(updateBookingDto);

    // Convert date strings to Date objects if present
    const startDateObj = trimmedDto.startDate ? new Date(trimmedDto.startDate) : undefined;
    const endDateObj = trimmedDto.endDate ? new Date(trimmedDto.endDate) : undefined;

    // Validate dates if both are provided
    if (startDateObj && endDateObj) {
      if (!InputUtils.isValidDateRange(startDateObj, endDateObj)) {
        throw new BadRequestException('Start date must be before end date');
      }
    } else if (startDateObj) {
      const existing = await this.prismaService.booking.findUnique({ where: { id } });
      if (!existing?.endDate) {
        throw new BadRequestException('Existing endDate is missing');
      }
      if (!InputUtils.isValidDateRange(startDateObj, existing.endDate)) {
        throw new BadRequestException('Start date must be before existing end date');
      }
    } else if (endDateObj) {
      const existing = await this.prismaService.booking.findUnique({ where: { id } });
      if (!existing?.startDate) {
        throw new BadRequestException('Existing startDate is missing');
      }
      if (!InputUtils.isValidDateRange(existing.startDate, endDateObj)) {
        throw new BadRequestException('End date must be after existing start date');
      }
    }

    // Check if start date is in the future if provided
    if (
      startDateObj &&
      !InputUtils.isFutureDate(startDateObj)
    ) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Check property availability if dates or property are being updated
    if (startDateObj || endDateObj || trimmedDto.propertyId) {
      const existing = await this.prismaService.booking.findUnique({ where: { id } });
      const propertyId = trimmedDto.propertyId || existing?.propertyId;
      const startDate = startDateObj || existing?.startDate;
      const endDate = endDateObj || existing?.endDate;

      if (!propertyId) {
        throw new BadRequestException('Property ID is missing');
      }
      if (!startDate || !endDate) {
        throw new BadRequestException('Start date or end date is missing');
      }
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
          ...(startDateObj && {
            startDate: startDateObj,
          }),
          ...(endDateObj && { endDate: endDateObj }),
        },
        include: {
          property: true,
        },
      });
      return {
        success: true,
        message: 'Booking updated successfully',
        data: updatedBooking,
      };
    } catch (error) {
      this.logger.error('Failed to update booking', error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(`Cancelling booking with ID: ${id}`);

    // Check if booking exists
    const existingBooking = await this.prismaService.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      this.logger.error(`Booking with ID ${id} not found`);
      return ResponseHelper.error(
        `Booking with ID ${id} not found`,
        `Booking with ID ${id} not found`,
        'error'
      );
    }

    try {
      const cancelledBooking = await this.prismaService.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return ResponseHelper.success(
        'Booking cancelled successfully',
        cancelledBooking
      );
    } catch (error) {
      this.logger.error('Failed to cancel booking', error.stack);
      return ResponseHelper.error(
        'Failed to cancel booking',
        error.message || 'Unknown error',
        'error'
      );
    }
  }

  private async checkPropertyAvailability(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string,
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
