import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';
import { IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

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
    description:
      'The date from which the property is available (DD-MM-YYYY format)',
    example: '01-01-2024',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'availableFrom must be in DD-MM-YYYY format (e.g., 01-01-2024)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const [day, month, year] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return value as Date | undefined;
  })
  availableFrom?: Date;

  @ApiProperty({
    description:
      'The date until which the property is available (DD-MM-YYYY format)',
    example: '31-12-2024',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'availableTo must be in DD-MM-YYYY format (e.g., 31-12-2024)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const [day, month, year] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return value as Date | undefined;
  })
  availableTo?: Date;
}
