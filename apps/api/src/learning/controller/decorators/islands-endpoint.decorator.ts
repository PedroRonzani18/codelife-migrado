import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IslandDetailResponseDto } from '../../dto';

export function GetIslandEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Detalha a fixture experimental da ilha' }),
    ApiParam({ name: 'islandKey', example: 'island-3', description: 'Slug estável da ilha controlada.' }),
    ApiResponse({ status: 200, description: 'Ilha e níveis ordenados com disponibilidade derivada para a pessoa autenticada.', type: IslandDetailResponseDto }),
    ApiResponse({ status: 400, description: 'Slug inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiResponse({ status: 404, description: 'Ilha não encontrada.' }),
  );
}
