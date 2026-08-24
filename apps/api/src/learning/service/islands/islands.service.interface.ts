import type { IslandDetail } from '@codelife/contracts/learning';

export interface IIslandsService {
  islandDetail(userId: string, slug: string): Promise<IslandDetail>;
}
