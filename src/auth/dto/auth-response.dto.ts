import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Authenticated' })
  message!: string;

  @ApiProperty({ example: { accessToken: '...' } })
  data!: { accessToken: string };

  @ApiProperty({ example: '2025-08-08T12:00:00.000Z' })
  timestamp!: string;
}


