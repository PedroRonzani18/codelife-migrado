import { ApiProperty } from '@nestjs/swagger';
import { IsIn, Matches } from 'class-validator';
import type { UserRole } from '@codelife/contracts/users';

const stableKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const userRoles = ['USER', 'ADMIN'] as const;

export class UserKeyParamDto {
  @ApiProperty({ example: 'aluna-demo', description: 'Chave pública estável do usuário.' })
  @Matches(stableKeyPattern)
  userKey!: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: userRoles, example: 'ADMIN' })
  @IsIn(userRoles)
  role!: UserRole;
}
