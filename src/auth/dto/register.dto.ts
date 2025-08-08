import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Mayowa' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Bernard' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '++2349146694787' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/)
  phoneNumber!: string;

  @ApiProperty({ example: 'mayowa@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @MinLength(8)
  password!: string;
}


