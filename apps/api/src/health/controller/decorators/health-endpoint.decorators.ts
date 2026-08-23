import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function GetHealthAliasEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Alias compatível da verificação de liveness' }),
  );
}

export function GetHealthLiveEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Verifica que o processo da API está vivo' }),
  );
}

export function GetHealthReadyEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Verifica que a API e suas dependências estão disponíveis' }),
  );
}
