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
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by booking status (e.g., confirmed, cancelled, pending)' })
  @ApiResponse({ status: 200, description: 'List of bookings retrieved successfully', schema: {
    example: {
      success: true,
      message: 'Bookings retrieved successfully',
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasMore: false,
      length: 1,
      data: [
        {
          id: '1bc3ae29-ed44-4f08-a319-4a5faef9e1b2',
          propertyId: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
          userName: 'John Doe',
          startDate: '2025-08-10',
          endDate: '2025-08-12',
          status: 'confirmed',
          property: {
            id: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
            title: 'Cozy Mountain Cabin',
            description: 'Rustic 2-bedroom cabin...',
            pricePerNight: 180,
            availableFrom: '2025-03-01',
            availableTo: '2025-11-30',
            status: 'active',
          }
        }
      ],
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
    return this.bookingsService.findAll(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid booking ID' })
  async findOne(@Param('id', ParseIntPipe) id: string, @Req() req: Request) {
    return this.bookingsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking for a property' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created successfully', schema: {
    example: {
      success: true,
      message: 'Booking created successfully',
      data: {
        id: '1bc3ae29-ed44-4f08-a319-4a5faef9e1b2',
        propertyId: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
        userName: 'John Doe',
        startDate: '2025-08-10',
        endDate: '2025-08-12',
        property: {
          id: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
          title: 'Cozy Mountain Cabin',
          description: 'Rustic 2-bedroom cabin...',
          pricePerNight: 180,
          availableFrom: '2025-03-01',
          availableTo: '2025-11-30',
          status: 'active',
        }
      }
    }
  }})
  @ApiResponse({ status: 400, description: 'Invalid booking data', schema: {
    example: {
      success: false,
      message: 'Start date must be before end date',
      error: 'Start date must be before end date'
    }
  }})
  @ApiResponse({ status: 404, description: 'Property not found', schema: {
    example: {
      success: false,
      message: 'Property with ID eac1d11b-65f6-4022-a065-c166e179e2ae not found',
      error: 'Property with ID eac1d11b-65f6-4022-a065-c166e179e2ae not found'
    }
  }})
  @ApiResponse({ status: 409, description: 'Booking dates overlap with existing bookings', schema: {
    example: {
      success: false,
      message: 'Booking dates overlap with existing bookings',
      error: {
        message: 'Booking dates overlap with existing bookings',
        overlaps: [
          { startDate: '2025-08-10', endDate: '2025-08-12' }
        ],
        requested: {
          startDate: '2025-08-10',
          endDate: '2025-08-12'
        }
      }
    }
  }})
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: Request,
  ) {
    return this.bookingsService.create(createBookingDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: 'number' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid booking data or ID' })
  @ApiResponse({ status: 409, description: 'Property is not available for the requested dates' })
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: Request,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel (soft delete) a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully', schema: {
    example: {
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        id: '1bc3ae29-ed44-4f08-a319-4a5faef9e1b2',
        propertyId: 'eac1d11b-65f6-4022-a065-c166e179e2ae',
        userName: 'John Doe',
        startDate: '2025-08-10T00:00:00.000Z',
        endDate: '2025-08-12T00:00:00.000Z',
        status: 'cancelled',
        // ...other fields as returned by your service
      }
    }
  }})
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid booking ID' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.bookingsService.remove(id);
  }
}
