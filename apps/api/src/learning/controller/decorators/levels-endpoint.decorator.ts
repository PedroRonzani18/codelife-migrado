import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiForbiddenResponse, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { LevelDetailResponseDto, TextCodeSlideResponseDto, TextImageSlideResponseDto, TextTextSlideResponseDto } from '../../dto';

export function GetLevelEndpoint() {
  return applyDecorators(
    ApiExtraModels(TextTextSlideResponseDto, TextImageSlideResponseDto, TextCodeSlideResponseDto),
    ApiOperation({ summary: 'Retorna o conteúdo ordenado de um nível' }),
    ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível.' }),
    ApiResponse({ status: 200, description: 'Nível, slides ordenados e vínculos previousSlideId/nextSlideId.', type: LevelDetailResponseDto }),
    ApiResponse({ status: 400, description: 'UUID inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiForbiddenResponse({ description: 'LEVEL_BLOCKED quando o predecessor ainda não foi concluído.' }),
    ApiResponse({ status: 404, description: 'Nível não encontrado.' }),
  );
}
