import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '@codelife/contracts/users';

const userRoles = ['USER', 'ADMIN'] as const;

export class AdminUserResponseDto {
  @ApiProperty({ example: 'aluna-demo', description: 'Chave pública estável do usuário.' })
  id!: string;

  @ApiProperty({ example: 'aluna.demo' })
  username!: string;

  @ApiProperty({ example: 'Aluna Demo' })
  displayName!: string;

  @ApiProperty({ enum: userRoles, example: 'USER' })
  role!: UserRole;
}
