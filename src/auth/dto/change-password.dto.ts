import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentP@ss1' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewStrongerP@ss2' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}


