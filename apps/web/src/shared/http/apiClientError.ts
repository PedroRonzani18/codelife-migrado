import type { ApiErrorCode, ApiValidationErrorDetail } from '@codelife/contracts/errors';

export class ApiClientError extends Error {
  readonly name = 'ApiClientError';

  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ApiValidationErrorDetail[],
    readonly requestId?: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
