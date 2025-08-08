import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Request } from 'express';
import { PropertyDetailsResponseDto, BookedDateDto } from './dto/property-details.dto';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all properties with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by property status (e.g., active, inactive)' })
  @ApiResponse({ status: 200, description: 'List of properties retrieved successfully', schema: {
    example: {
      success: true,
      message: 'Properties fetched successfully',
      data: [
        {
          id: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
          title: 'Cozy Mountain Cabin',
          description: 'Rustic 2-bedroom cabin...',
          pricePerNight: 180,
          availableFrom: '2025-03-01',
          availableTo: '2025-11-30',
          status: 'active',
        }
      ],
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasMore: false,
      length: 1,
      timestamp: '2025-08-08T08:27:39.049Z'
    }
  }})
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('status') status?: string,
    // @Req() req: Request,
  ) {
    return this.propertiesService.findAll(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully', type: PropertyDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 400, description: 'Invalid property ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new property' })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid property data' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: Request,
  ) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', description: 'Property ID', type: 'number' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 400, description: 'Invalid property data or ID' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request,
  ) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({ name: 'id', description: 'Property ID', type: 'number' })
  @ApiResponse({ status: 204, description: 'Property deleted successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 400, description: 'Invalid property ID' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.propertiesService.remove(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get availability for a property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID', type: 'string' })
  @ApiOkResponse({ description: 'Availability info for the property', schema: {
    example: {
      success: true,
      message: 'Availability retrieved successfully',
      data: {
        availableFrom: '2025-03-01',
        availableTo: '2025-11-30',
        bookedDates: [
          { startDate: '2025-08-10', endDate: '2025-08-12' },
          { startDate: '2025-08-12', endDate: '2025-08-14' }
        ]
      },
      timestamp: '2025-08-07T23:03:12.599Z'
    }
  }})
  async getAvailability(@Param('id') id: string) {
    return this.propertiesService.getAvailability(id);
  }
}
