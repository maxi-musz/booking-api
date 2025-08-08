import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';
import { IsOptional } from 'class-validator';
import { IsDDMMYYYYDate } from '../../common/validators/is-ddmmyyyy-date.validator';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiProperty({
    description: 'The ID of the property to book',
    example: 1,
    minimum: 1,
    required: false,
  })
  propertyId?: string;

  @ApiProperty({
    description: 'The name of the user making the booking',
    example: 'Ngozi Nwosu',
    maxLength: 255,
    required: false,
  })
  userName?: string;

  @ApiProperty({
    description: 'The start date of the booking (DD-MM-YYYY format)',
    example: '01-01-2024',
    required: false,
  })
  @IsOptional()
  @IsDDMMYYYYDate()
  startDate?: string;

  @ApiProperty({
    description: 'The end date of the booking (DD-MM-YYYY format)',
    example: '05-01-2024',
    required: false,
  })
  @IsOptional()
  @IsDDMMYYYYDate()
  endDate?: string;
}
