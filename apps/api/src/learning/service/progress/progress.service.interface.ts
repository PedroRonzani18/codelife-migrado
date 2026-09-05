import type { ProgressSnapshot, UpdateCurrentSlideInput } from '@codelife/contracts/progress';

export interface IProgressService {
  snapshot(userId: string): Promise<ProgressSnapshot>;
  start(userId: string, levelId: string): Promise<ProgressSnapshot>;
  navigate(userId: string, levelId: string, input: UpdateCurrentSlideInput): Promise<ProgressSnapshot>;
  complete(userId: string, levelId: string): Promise<ProgressSnapshot>;
}
