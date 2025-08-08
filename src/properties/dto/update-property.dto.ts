import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';
import { IsOptional } from 'class-validator';
import { IsDDMMYYYYDate } from '../../common/validators/is-ddmmyyyy-date.validator';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiProperty({
    description: 'The title of the property',
    example: 'Beautiful Beach House',
    maxLength: 255,
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'The description of the property',
    example: 'A stunning beachfront property with amazing ocean views',
    maxLength: 1000,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The price per night for the property',
    example: 150.0,
    minimum: 0,
    required: false,
  })
  pricePerNight?: number;

  @ApiProperty({
    description: 'The date from which the property is available (DD-MM-YYYY format)',
    example: '01-01-2024',
    required: false,
  })
  @IsOptional()
  @IsDDMMYYYYDate()
  availableFrom?: string;

  @ApiProperty({
    description: 'The date until which the property is available (DD-MM-YYYY format)',
    example: '31-12-2024',
    required: false,
  })
  @IsOptional()
  @IsDDMMYYYYDate()
  availableTo?: string;
}
