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

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(page = 1, limit = 10): Promise<Property[]> {
    this.logger.log(`Fetching properties with page: ${page}, limit: ${limit}`);

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
      );
    }

    try {
      const properties = await this.prismaService.property.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          id: 'desc',
        },
      });

      this.logger.log(`Successfully fetched ${properties.length} properties`);
      return properties;
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

  async findOne(id: number): Promise<Property> {
    this.logger.log(`Fetching property with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid property ID. Must be a positive number.',
      );
    }

    try {
      const property = await this.prismaService.property.findUnique({
        where: { id },
      });

      if (!property) {
        this.logger.warn(`Property with ID ${id} not found`);
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      this.logger.log(`Successfully fetched property with ID: ${id}`);
      return property;
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

  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    this.logger.log('Creating new property');

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(createPropertyDto);

    // Validate dates
    if (
      !InputUtils.isValidDateRange(
        trimmedDto.availableFrom,
        trimmedDto.availableTo,
      )
    ) {
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
          availableFrom: new Date(trimmedDto.availableFrom),
          availableTo: new Date(trimmedDto.availableTo),
        },
      });

      this.logger.log(`Successfully created property with ID: ${property.id}`);
      return property;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create property: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async update(
    id: number,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<Property> {
    this.logger.log(`Updating property with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid property ID. Must be a positive number.',
      );
    }

    // Check if property exists
    const existingProperty = await this.findOne(id);

    // Trim string inputs
    const trimmedDto = InputUtils.trimObject(updatePropertyDto);

    // Validate dates if both are provided
    if (trimmedDto.availableFrom && trimmedDto.availableTo) {
      if (
        !InputUtils.isValidDateRange(
          trimmedDto.availableFrom,
          trimmedDto.availableTo,
        )
      ) {
        throw new BadRequestException(
          'Available from date must be before available to date',
        );
      }
    } else if (trimmedDto.availableFrom) {
      // If only availableFrom is provided, check against existing availableTo
      if (
        !InputUtils.isValidDateRange(
          trimmedDto.availableFrom,
          existingProperty.availableTo,
        )
      ) {
        throw new BadRequestException(
          'Available from date must be before existing available to date',
        );
      }
    } else if (trimmedDto.availableTo) {
      // If only availableTo is provided, check against existing availableFrom
      if (
        !InputUtils.isValidDateRange(
          existingProperty.availableFrom,
          trimmedDto.availableTo,
        )
      ) {
        throw new BadRequestException(
          'Available to date must be after existing available from date',
        );
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
          ...(trimmedDto.availableFrom && {
            availableFrom: new Date(trimmedDto.availableFrom),
          }),
          ...(trimmedDto.availableTo && {
            availableTo: new Date(trimmedDto.availableTo),
          }),
        },
      });

      this.logger.log(`Successfully updated property with ID: ${id}`);
      return updatedProperty;
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

  async remove(id: number): Promise<Property> {
    this.logger.log(`Deleting property with ID: ${id}`);

    if (!InputUtils.isPositiveNumber(id)) {
      throw new BadRequestException(
        'Invalid property ID. Must be a positive number.',
      );
    }

    // Check if property exists
    await this.findOne(id);

    try {
      const deletedProperty = await this.prismaService.property.delete({
        where: { id },
      });

      this.logger.log(`Successfully deleted property with ID: ${id}`);
      return deletedProperty;
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
}
