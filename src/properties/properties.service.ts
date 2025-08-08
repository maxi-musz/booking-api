import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Property } from '../../generated/prisma';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { InputUtils } from '../common/utils/input.utils';
import { ResponseHelper } from '../shared/helpers/response.helper';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(page = 1, limit = 10, status?: string): Promise<any> {
    this.logger.log(`Fetching properties with page: ${page}, limit: ${limit}, status: ${status}`);

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
    // Add more filters as needed (e.g., price, date range)

    try {
      const [properties, totalItems] = await Promise.all([
        this.prismaService.property.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        this.prismaService.property.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);
      const hasMore = page < totalPages;

      const formattedResponse = properties.map((property) => ({
        id: property.id,
        title: property.title,
        description: property.description,
        pricePerNight: property.pricePerNight,
        availableFrom: property.availableFrom.toISOString().slice(0, 10),
        availableTo: property.availableTo.toISOString().slice(0, 10),
        status: property.status,
      }));

      this.logger.log(`Successfully fetched ${properties.length} properties`);
      return {
        success: true,
        message: 'Properties fetched successfully',
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasMore,
        length: properties.length,
        data: formattedResponse,
        // timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch properties: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const count = await this.prismaService.property.count();
      return count;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to count properties: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findOne(id: string){
    this.logger.log(`Fetching property with ID: ${id}`);

    try {
      const property = await this.prismaService.property.findUnique({
        where: { id },
      });

      if (!property) {
        this.logger.warn(`Property with ID ${id} not found`);
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      // Fetch all bookings for this property
      const bookings = await this.prismaService.booking.findMany({
        where: { propertyId: id },
        select: {
          startDate: true,
          endDate: true,
        },
      });

      // Format booked dates as array of ranges
      const bookedDates = bookings.map(b => ({
        startDate: b.startDate.toISOString().slice(0, 10),
        endDate: b.endDate.toISOString().slice(0, 10),
      }));

      const formattedProperty = {
        id: property.id,
        title: property.title,
        description: property.description,
        pricePerNight: property.pricePerNight,
        availableFrom: property.availableFrom.toISOString().slice(0, 10),
        availableTo: property.availableTo.toISOString().slice(0, 10),
        bookedDates,
      }

      this.logger.log(`Successfully fetched property with ID: ${id}`);
      return ResponseHelper.success(
        "Property successfully retrieved",
        formattedProperty
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to fetch property with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async create(createPropertyDto: CreatePropertyDto) {
    this.logger.log('Creating new property');

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(createPropertyDto);

    // Convert date strings to Date objects (support DD-MM-YYYY and YYYY-MM-DD)
    function parseDate(dateStr: string): Date {
      // If format is DD-MM-YYYY, convert to YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(dateStr);
    }
    const availableFromDate = parseDate(trimmedDto.availableFrom);
    const availableToDate = parseDate(trimmedDto.availableTo);

    // Validate dates
    if (!InputUtils.isValidDateRange(availableFromDate, availableToDate)) {
      throw new BadRequestException(
        'Available from date must be before available to date',
      );
    }

    // Validate price
    if (!InputUtils.isPositiveNumber(trimmedDto.pricePerNight)) {
      throw new BadRequestException(
        'Price per night must be a positive number',
      );
    }

    try {
      const property = await this.prismaService.property.create({
        data: {
          title: trimmedDto.title,
          description: trimmedDto.description,
          pricePerNight: trimmedDto.pricePerNight,
          availableFrom: availableFromDate,
          availableTo: availableToDate,
        },
      });

      const formattedProperty = {
        id: property.id,
        title: property.title,
        description: property.description,
        pricePerNight: property.pricePerNight,
        availableFrom: property.availableFrom.toISOString().slice(0, 10),
        availableTo: property.availableTo.toISOString().slice(0, 10),
      };

      this.logger.log(`Successfully created property with ID: ${property.id}`);
      return ResponseHelper.success(
        'Property created successfully',
        formattedProperty,
      );
    } catch (error) {
      this.logger.error(`Failed to create property: ${error}`);
      return ResponseHelper.error(
        'Failed to create property',
        error.message,
      );
    }
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ) {
    this.logger.log(`Updating property with ID: ${id}`);

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(updatePropertyDto);

    // Convert date strings to Date objects if present
    const availableFromDate = trimmedDto.availableFrom
      ? InputUtils.parseDate(trimmedDto.availableFrom)
      : undefined;
    const availableToDate = trimmedDto.availableTo
      ? InputUtils.parseDate(trimmedDto.availableTo)
      : undefined;

    // Check if property exists
    const existingResponse = await this.findOne(id);
    const existingProperty = existingResponse?.data;

    // Validate dates if both are provided
    if (availableFromDate && availableToDate) {
      if (!InputUtils.isValidDateRange(availableFromDate, availableToDate)) {
        throw new BadRequestException('Available from date must be before available to date');
      }
    } else if (availableFromDate) {
      if (!existingProperty || !existingProperty.availableTo) {
        throw new BadRequestException('Existing availableTo date is missing');
      }
      const existingAvailableToDate = InputUtils.parseDate(existingProperty.availableTo);
      if (!InputUtils.isValidDateRange(availableFromDate, existingAvailableToDate)) {
        throw new BadRequestException('Available from date must be before existing available to date');
      }
    } else if (availableToDate) {
      if (!existingProperty || !existingProperty.availableFrom) {
        throw new BadRequestException('Existing availableFrom date is missing');
      }
      const existingAvailableFromDate = InputUtils.parseDate(existingProperty.availableFrom);
      if (!InputUtils.isValidDateRange(existingAvailableFromDate, availableToDate)) {
        throw new BadRequestException('Available to date must be after existing available from date');
      }
    }

    // Validate price if provided
    if (
      trimmedDto.pricePerNight !== undefined &&
      !InputUtils.isPositiveNumber(trimmedDto.pricePerNight)
    ) {
      throw new BadRequestException(
        'Price per night must be a positive number',
      );
    }

    try {
      const updatedProperty = await this.prismaService.property.update({
        where: { id },
        data: {
          ...(trimmedDto.title && { title: trimmedDto.title }),
          ...(trimmedDto.description && {
            description: trimmedDto.description,
          }),
          ...(trimmedDto.pricePerNight !== undefined && {
            pricePerNight: trimmedDto.pricePerNight,
          }),
          ...(availableFromDate && {
            availableFrom: availableFromDate,
          }),
          ...(availableToDate && {
            availableTo: availableToDate,
          }),
        },
      });

      this.logger.log(`Successfully updated property with ID: ${id}`);
      return ResponseHelper.success(
        'Property updated successfully',
        updatedProperty,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update property with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async remove(id: string){
    this.logger.log(`Deleting property with ID: ${id}`);

    // Check if property exists
    await this.findOne(id);

    try {
      const deletedProperty = await this.prismaService.property.delete({
        where: { id },
      });

      const formattedResponse = {
        id: deletedProperty.id,
        title: deletedProperty.title,
        description: deletedProperty.description,
        pricePerNight: deletedProperty.pricePerNight,
        availableFrom: deletedProperty.availableFrom.toISOString().slice(0, 10),
        availableTo: deletedProperty.availableTo.toISOString().slice(0, 10),
      };

      this.logger.log(`Successfully deleted property with ID: ${id}`);
      return ResponseHelper.success(
        'Property deleted successfully',
        formattedResponse
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete property with ID ${id}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async getAvailability(id: string) {
    this.logger.log(`Fetching availability for property ID: ${id}`);
    try {
      const property = await this.prismaService.property.findUnique({ where: { id } });
      if (!property) {
        this.logger.warn(`Property with ID ${id} not found`);
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      const bookings = await this.prismaService.booking.findMany({
        where: { propertyId: id },
        select: { startDate: true, endDate: true },
      });
      const bookedDates = bookings.map(b => ({
        startDate: b.startDate.toISOString().slice(0, 10),
        endDate: b.endDate.toISOString().slice(0, 10),
      }));
      const data = {
        availableFrom: property.availableFrom.toISOString().slice(0, 10),
        availableTo: property.availableTo.toISOString().slice(0, 10),
        bookedDates,
      };
      return ResponseHelper.success('Availability retrieved successfully', data);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch availability for property ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
