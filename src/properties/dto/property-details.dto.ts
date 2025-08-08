import { ApiProperty } from '@nestjs/swagger';

export class BookedDateDto {
  @ApiProperty({ example: '2025-08-10', description: 'Start date of the booking (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ example: '2025-08-12', description: 'End date of the booking (YYYY-MM-DD)' })
  endDate: string;
}

export class PropertyDetailsDto {
  @ApiProperty({ example: 'eac1d11b-65f6-4022-a065-c166e179e2ae', description: 'Property UUID' })
  id: string;

  @ApiProperty({ example: 'Cozy Mountain Cabin', description: 'Property title' })
  title: string;

  @ApiProperty({ example: 'Rustic 2-bedroom cabin nestled in the mountains...', description: 'Property description' })
  description: string;

  @ApiProperty({ example: 180, description: 'Price per night' })
  pricePerNight: number;

  @ApiProperty({ example: '2025-03-01', description: 'Available from date (YYYY-MM-DD)' })
  availableFrom: string;

  @ApiProperty({ example: '2025-11-30', description: 'Available to date (YYYY-MM-DD)' })
  availableTo: string;

  @ApiProperty({ type: [BookedDateDto], description: 'Array of booked date ranges' })
  bookedDates: BookedDateDto[];
}

export class PropertyDetailsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Property successfully retrieved' })
  message: string;

  @ApiProperty({ type: PropertyDetailsDto })
  data: PropertyDetailsDto;

  @ApiProperty({ example: '2025-08-07T23:03:12.599Z', description: 'Response timestamp' })
  timestamp: string;
}
