import type { ApiErrorCode } from '@codelife/contracts/errors';
import { ApiClientError } from './apiClientError';

const messages: Partial<Record<ApiErrorCode, string>> = {
  ISLAND_BLOCKED: 'A ilha está bloqueada. Conclua a ilha anterior antes de continuar.',
  LEVEL_BLOCKED: 'Conclua o nível anterior antes de continuar.',
  LEVEL_NOT_STARTED: 'Inicie o nível para acessar o conteúdo.',
  INVALID_SLIDE_TRANSITION: 'Não foi possível ir diretamente para esse slide.',
  LEVEL_NOT_READY_FOR_COMPLETION: 'Chegue ao último slide antes de concluir o nível.',
  RESOURCE_NOT_FOUND: 'Conteúdo não encontrado.',
  VALIDATION_ERROR: 'Revise os dados informados.',
  UNIQUE_CONFLICT: 'Já existe um item com esse identificador ou ordem.',
  CONTENT_STALE: 'O conteúdo foi alterado em outra sessão. Recarregue os dados para continuar.',
  CONTENT_HAS_PROGRESS: 'Este item possui progresso de estudantes e não pode ser alterado ou removido.',
  CONTENT_NOT_DRAFT: 'Apenas itens em rascunho podem ser excluídos.',
  CONTENT_NOT_PUBLISHABLE: 'O item não atende aos requisitos mínimos para publicação.',
  CONTENT_ORDER_CONFLICT: 'A reordenação conflita com o histórico de progresso existente.',
  PAYLOAD_TOO_LARGE: 'O arquivo enviado excede o limite máximo permitido de 5 MB.',
  UNSUPPORTED_MEDIA_TYPE: 'Formato de imagem não suportado. Envie PNG, JPEG ou WebP.',
  UNAUTHORIZED: 'Sua sessão expirou. Inicie uma nova sessão.',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação.',
  INTERNAL_ERROR: 'Ocorreu uma falha inesperada. Tente novamente.',
  SERVICE_UNAVAILABLE: 'O serviço está temporariamente indisponível.',
};

export function domainErrorMessage(code?: ApiErrorCode): string {
  return (code && messages[code]) ?? 'Não foi possível concluir a solicitação.';
}

export function mapApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return domainErrorMessage(error.code);
  if (error instanceof Error && error.message) return error.message;
  return domainErrorMessage();
}

export const mapDomainErrorMessage = mapApiErrorMessage;
