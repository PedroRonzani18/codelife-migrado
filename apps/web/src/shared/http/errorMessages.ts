import type { ApiErrorCode } from '@codelife/contracts/errors';
import { ApiClientError } from './apiClientError';

const messages: Partial<Record<ApiErrorCode, string>> = {
  LEVEL_BLOCKED: 'Conclua o nível anterior antes de continuar.',
  LEVEL_NOT_STARTED: 'Inicie o nível para acessar o conteúdo.',
  INVALID_SLIDE_TRANSITION: 'Não foi possível ir diretamente para esse slide.',
  LEVEL_NOT_READY_FOR_COMPLETION: 'Chegue ao último slide antes de concluir o nível.',
  RESOURCE_NOT_FOUND: 'Conteúdo não encontrado.',
  VALIDATION_ERROR: 'Revise os dados informados.',
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
