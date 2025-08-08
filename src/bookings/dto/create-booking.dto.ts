import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { IsDDMMYYYYDate } from '../../common/validators/is-ddmmyyyy-date.validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'The ID of the property to book',
    example: "eac1d11b-65f6-4022-a065-c166e179e2ae",
    minimum: 1,
  })
  @IsString()
  propertyId: string;

  @ApiProperty({
    description: 'The name of the user making the booking',
    example: 'Chukwuemeka Okafor',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    description: 'The start date of the booking (DD-MM-YYYY format)',
    example: '01-01-2024',
  })
  @IsNotEmpty()
  @IsDDMMYYYYDate()
  startDate: string;

  @ApiProperty({
    description: 'The end date of the booking (DD-MM-YYYY format)',
    example: '05-01-2024',
  })
  @IsNotEmpty()
  @IsDDMMYYYYDate()
  endDate: string;
}
