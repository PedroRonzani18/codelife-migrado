import { Inject, Injectable } from '@nestjs/common';
import type { AdminContentTree } from '@codelife/contracts/content-management';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IIslandsRepository } from '../islands/islands.repository.interface';

@Injectable()
export class AdminContentTreeService {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY)
    private readonly islandsRepo: IIslandsRepository,
  ) {}

  async getTree(): Promise<AdminContentTree> {
    return this.islandsRepo.getAdminTree();
  }
}
