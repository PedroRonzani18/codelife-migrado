import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IslandCatalogItemResponseDto, IslandDetailResponseDto } from '../dto';

export function GetIslandsEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Lista o catálogo público de ilhas com disponibilidade' }),
    ApiResponse({
      status: 200,
      description: 'Catálogo ordenado de ilhas publicadas com disponibilidade derivada para a pessoa autenticada.',
      type: [IslandCatalogItemResponseDto],
    }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
  );
}

export function GetIslandEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Detalha a fixture experimental da ilha' }),
    ApiParam({ name: 'islandKey', example: 'island-3', description: 'Slug estável da ilha controlada.' }),
    ApiResponse({
      status: 200,
      description: 'Ilha e níveis ordenados com disponibilidade derivada para a pessoa autenticada.',
      type: IslandDetailResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Slug inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiResponse({ status: 403, description: 'Ilha bloqueada.' }),
    ApiResponse({ status: 404, description: 'Ilha não encontrada.' }),
  );
}

