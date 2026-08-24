import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'aluna.demo' })
  username!: string;

  @ApiProperty({ example: 'Aluna Demo' })
  displayName!: string;
}

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}

export class LogoutInputDto {}
