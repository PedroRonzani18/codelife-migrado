import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProduces, ApiResponse } from '@nestjs/swagger';

export function GetMediaEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Entrega um ativo de mídia controlado' }),
    ApiParam({ name: 'mediaAssetId', format: 'uuid', description: 'UUID público do ativo de mídia.' }),
    ApiProduces('image/svg+xml'),
    ApiResponse({ status: 200, description: 'Fluxo do ativo solicitado, com cache privado.' }),
    ApiResponse({ status: 400, description: 'UUID inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiResponse({ status: 404, description: 'Ativo inexistente ou não controlado.' }),
  );
}
