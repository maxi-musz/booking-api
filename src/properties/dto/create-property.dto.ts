import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { IsDDMMYYYYDate } from '../../common/validators/is-ddmmyyyy-date.validator';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'The title of the property',
    example: 'Beautiful Beach House',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'The description of the property',
    example: 'A stunning beachfront property with amazing ocean views',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'The price per night for the property',
    example: 150.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty({
    description: 'The date from which the property is available (DD-MM-YYYY format)',
    example: '01-01-2024',
  })
  @IsNotEmpty()
  @IsDDMMYYYYDate()
  availableFrom: string;

  @ApiProperty({
    description: 'The date until which the property is available (DD-MM-YYYY format)',
    example: '31-12-2024',
  })
  @IsNotEmpty()
  @IsDDMMYYYYDate()
  availableTo: string;
}
