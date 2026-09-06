import { applyDecorators, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthSessionResponseDto, LogoutInputDto, OkResponseDto } from '../../dto';
import { ClearSessionCookieInterceptor, SetSessionCookieInterceptor } from '../../interceptors/session-cookie.interceptor';

export function GetCurrentSessionEndpoint() {
  return applyDecorators(
    ApiCookieAuth(),
    ApiOperation({ summary: 'Retorna a pessoa da sessão experimental atual' }),
    ApiResponse({ status: 200, description: 'Sessão atual.', type: AuthSessionResponseDto }),
    ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' }),
  );
}

export function ExperimentalLoginEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    UseInterceptors(SetSessionCookieInterceptor),
    ApiOperation({ summary: 'Inicia a sessão fixa aluna.demo somente em desenvolvimento/teste' }),
    ApiResponse({ status: 200, description: 'Sessão experimental criada e cookie HttpOnly emitido.', type: AuthSessionResponseDto }),
    ApiResponse({ status: 403, description: 'Login experimental desabilitado fora do ambiente permitido.' }),
    ApiResponse({ status: 429, description: 'Limite de tentativas atingido.' }),
  );
}

export function GoogleAuthorizationEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Inicia a autenticação Google e redireciona para o provedor' }),
    ApiResponse({ status: 302, description: 'Redirecionamento para o Google com transação OIDC protegida.' }),
    ApiResponse({ status: 503, description: 'Integração Google não configurada ou indisponível.' }),
  );
}

export function GoogleCallbackEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Processa o callback Google e cria a sessão local' }),
    ApiResponse({ status: 302, description: 'Sessão CodeLife criada e redirecionamento para o frontend.' }),
    ApiResponse({ status: 401, description: 'Callback, transação ou claims Google inválidos.' }),
  );
}

export function LogoutEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    UseInterceptors(ClearSessionCookieInterceptor),
    ApiOperation({ summary: 'Encerra a sessão e remove o cookie de autenticação' }),
    ApiBody({ type: LogoutInputDto }),
    ApiResponse({ status: 200, description: 'Cookie de sessão removido.', type: OkResponseDto }),
    ApiForbiddenResponse({ description: 'Origin não confiável.' }),
  );
}
