import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

type RuntimeSchema<T> = { safeParse(value: unknown): { success: true; data: T } | { success: false } };

@Injectable()
export class ZodParsePipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: RuntimeSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Parâmetro inválido',
        details: [{ message: 'O valor informado não atende ao contrato esperado' }],
      });
    }
    return parsed.data;
  }
}
