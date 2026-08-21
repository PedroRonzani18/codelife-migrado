import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { islandDetailSchema, type IslandDetail } from '@codelife/contracts/learning';
import { ISLANDS_REPOSITORY, type IslandsRepositoryPort } from './islands.repository.port';

@Injectable()
export class IslandsService {
  constructor(@Inject(ISLANDS_REPOSITORY) private readonly repository: IslandsRepositoryPort) {}

  async islandDetail(slug: string): Promise<IslandDetail> {
    const island = await this.repository.islandBySlug(slug);
    if (!island) throw new NotFoundException(`Ilha ${slug} não encontrada`);
    return islandDetailSchema.parse({
      id: island.id,
      slug: island.slug,
      title: island.title,
      position: island.position,
      levelCount: island.levels.length,
      // Sem progresso persistido, apenas o primeiro nível pode estar disponível.
      // A derivação completa dos quatro estados pertence à Macroetapa 2.
      levels: island.levels.map((level, index) => ({ id: level.id, title: level.title, position: level.position, availability: index === 0 ? 'available' : 'blocked' })),
    });
  }
}
