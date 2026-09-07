import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiForbiddenResponse, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CompleteLevelInputDto, ProgressSnapshotResponseDto, StartLevelInputDto, UpdateCurrentSlideInputDto } from '../dto';

export function GetProgressEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Retorna o estado canônico da jornada autenticada' }),
    ApiResponse({ status: 200, description: 'Estado sem efeitos colaterais, contendo lastVisited e nextRecommended.', type: ProgressSnapshotResponseDto }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
  );
}

export function StartLevelEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Inicia um nível disponível no primeiro slide' }),
    ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível disponível.' }),
    ApiBody({ type: StartLevelInputDto }),
    ApiResponse({ status: 200, description: 'Estado atualizado. A repetição é idempotente e não reinicia o cursor.', type: ProgressSnapshotResponseDto }),
    ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiForbiddenResponse({ description: 'Origin não confiável ou LEVEL_BLOCKED.' }),
    ApiResponse({ status: 404, description: 'Nível não encontrado.' }),
  );
}

export function NavigateLevelEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Persiste uma transição sequencial de slide' }),
    ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível iniciado.' }),
    ApiBody({ type: UpdateCurrentSlideInputDto }),
    ApiResponse({ status: 200, description: 'Estado atualizado após a transição permitida.', type: ProgressSnapshotResponseDto }),
    ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiForbiddenResponse({ description: 'Origin não confiável.' }),
    ApiConflictResponse({ description: 'LEVEL_NOT_STARTED ou INVALID_SLIDE_TRANSITION.' }),
    ApiResponse({ status: 404, description: 'Nível ou slide fora do contexto.' }),
  );
}

export function CompleteLevelEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Conclui explicitamente o nível no último slide' }),
    ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível iniciado.' }),
    ApiBody({ type: CompleteLevelInputDto }),
    ApiResponse({ status: 200, description: 'Estado atualizado; a primeira conclusão preserva o timestamp.', type: ProgressSnapshotResponseDto }),
    ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
    ApiForbiddenResponse({ description: 'Origin não confiável.' }),
    ApiConflictResponse({ description: 'LEVEL_NOT_STARTED ou LEVEL_NOT_READY_FOR_COMPLETION.' }),
    ApiResponse({ status: 404, description: 'Nível não encontrado.' }),
  );
}
