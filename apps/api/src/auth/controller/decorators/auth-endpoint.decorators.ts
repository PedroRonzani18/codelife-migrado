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
