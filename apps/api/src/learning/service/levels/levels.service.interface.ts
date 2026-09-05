import type { LevelDetail } from '@codelife/contracts/learning';

export interface ILevelsService {
  levelDetail(userId: string, levelId: string): Promise<LevelDetail>;
}
