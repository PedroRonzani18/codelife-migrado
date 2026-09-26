import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    title: z.string().min(1),
    count: z.number().int().positive(),
  });

  const pipe = new ZodValidationPipe(schema);

  it('passes valid payload and returns parsed data', () => {
    const input = { title: 'Test Title', count: 5 };
    const result = pipe.transform(input);
    expect(result).toEqual(input);
  });

  it('throws BadRequestException with VALIDATION_ERROR and details on invalid payload', () => {
    const invalidInput = { title: '', count: -1 };
    expect(() => pipe.transform(invalidInput)).toThrow(BadRequestException);

    try {
      pipe.transform(invalidInput);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Payload inválido');
      expect(Array.isArray(response.details)).toBe(true);
      expect((response.details as unknown[]).length).toBeGreaterThan(0);
    }
  });
});
