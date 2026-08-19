import { BadRequestException } from '@nestjs/common';
import { stableKeySchema } from '@codelife/contracts/common';
import { ZodParsePipe } from './zod-parse.pipe';

describe('ZodParsePipe', () => {
  const pipe = new ZodParsePipe(stableKeySchema);

  it('returns parsed values and rejects invalid input', () => {
    expect(pipe.transform('island-3')).toBe('island-3');
    expect(() => pipe.transform('INVALID!')).toThrow(BadRequestException);
  });
});
