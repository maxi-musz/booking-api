import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    description: 'The ID of the property to book',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  propertyId: number;

  @ApiProperty({
    description: 'The name of the user making the booking',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'The start date of the booking (DD-MM-YYYY format)',
    example: '01-01-2024',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'startDate must be in DD-MM-YYYY format (e.g., 01-01-2024)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const [day, month, year] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return value as Date;
  })
  startDate: Date;

  @ApiProperty({
    description: 'The end date of the booking (DD-MM-YYYY format)',
    example: '05-01-2024',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'endDate must be in DD-MM-YYYY format (e.g., 05-01-2024)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const [day, month, year] = value.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return value as Date;
  })
  endDate: Date;
}
