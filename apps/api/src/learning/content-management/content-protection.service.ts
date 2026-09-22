import { ConflictException, Injectable } from '@nestjs/common';
import type { IslandRecord } from '../islands/islands.repository.interface';
import type { LevelRecord } from '../levels/levels.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';

@Injectable()
export class ContentProtectionService {
  async validateIslandReorder(
    currentIslands: IslandRecord[],
    newOrderedIds: string[],
    progressRepo: IProgressRepository,
  ): Promise<void> {
    const highestPos = await progressRepo.highestIslandPositionWithProgress();
    if (highestPos === null) return;

    // Islands with position <= highestPos are protected from order change
    for (let i = 0; i < highestPos; i++) {
      if (i < currentIslands.length && newOrderedIds[i] !== currentIslands[i].id) {
        throw new ConflictException({
          code: 'CONTENT_ORDER_CONFLICT',
          message: 'Ilhas com progresso de estudantes não podem ter sua ordem alterada',
        });
      }
    }
  }

  async validateLevelReorder(
    island: IslandRecord,
    currentLevels: LevelRecord[],
    newOrderedIds: string[],
    progressRepo: IProgressRepository,
  ): Promise<void> {
    const highestIslandPos = await progressRepo.highestIslandPositionWithProgress();
    if (highestIslandPos !== null && highestIslandPos > island.position) {
      // Progress exists in a subsequent island -> all levels of this island are completely frozen
      const isModified = newOrderedIds.some((id, idx) => id !== currentLevels[idx]?.id);
      if (isModified) {
        throw new ConflictException({
          code: 'CONTENT_ORDER_CONFLICT',
          message: 'Níveis de ilha anterior a progresso registrado não podem ser reordenados',
        });
      }
      return;
    }

    const highestLevelPos = await progressRepo.highestLevelPositionWithProgress(island.id);
    if (highestLevelPos === null) return;

    for (let i = 0; i < highestLevelPos; i++) {
      if (i < currentLevels.length && newOrderedIds[i] !== currentLevels[i].id) {
        throw new ConflictException({
          code: 'CONTENT_ORDER_CONFLICT',
          message: 'Níveis com progresso de estudantes não podem ter sua ordem alterada',
        });
      }
    }
  }

  async validateSlideReorder(
    levelId: string,
    progressRepo: IProgressRepository,
  ): Promise<void> {
    const hasProgress = await progressRepo.hasProgressForLevel(levelId);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_ORDER_CONFLICT',
        message: 'Nível com progresso de estudantes não permite reordenação de seus slides',
      });
    }
  }

  async validateLevelInsertion(
    island: IslandRecord,
    progressRepo: IProgressRepository,
  ): Promise<void> {
    const highestIslandPos = await progressRepo.highestIslandPositionWithProgress();
    if (highestIslandPos !== null && highestIslandPos > island.position) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Não é permitido adicionar níveis em ilhas anteriores a progresso existente',
      });
    }
  }

  async validateSlideInsertion(
    levelId: string,
    progressRepo: IProgressRepository,
  ): Promise<void> {
    const hasProgress = await progressRepo.hasProgressForLevel(levelId);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Não é permitido adicionar slides em níveis com progresso existente',
      });
    }
  }
}
