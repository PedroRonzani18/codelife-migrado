import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AdminUserResponseDto, UpdateUserRoleDto } from '../../dto';

export function GetAdminUsersEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Lista os usuários persistidos para administração' }),
    ApiResponse({ status: 200, description: 'Usuários administrativos em ordem determinística.', type: [AdminUserResponseDto] }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiResponse({ status: 403, description: 'O papel ADMIN é necessário.' }),
  );
}

export function UpdateAdminUserRoleEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Altera o papel de um usuário persistido' }),
    ApiParam({ name: 'userKey', example: 'aluna-demo', description: 'Chave pública estável do usuário.' }),
    ApiBody({ type: UpdateUserRoleDto }),
    ApiResponse({ status: 200, description: 'Usuário atualizado.', type: AdminUserResponseDto }),
    ApiResponse({ status: 400, description: 'Chave ou corpo inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiResponse({ status: 403, description: 'O papel ADMIN é necessário ou a autodemissão foi solicitada.' }),
    ApiResponse({ status: 404, description: 'Usuário não encontrado.' }),
  );
}
