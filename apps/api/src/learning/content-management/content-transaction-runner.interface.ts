import type { IIslandsRepository } from '../islands/islands.repository.interface';
import type { ILevelsRepository } from '../levels/levels.repository.interface';
import type { ISlidesRepository } from '../slides/slides.repository.interface';
import type { IMediaRepository } from '../media/media.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';

export interface ContentTransactionRepositories {
  islands: IIslandsRepository;
  levels: ILevelsRepository;
  slides: ISlidesRepository;
  media: IMediaRepository;
  progress: IProgressRepository;
}

export interface IContentTransactionRunner {
  run<T>(operation: (repositories: ContentTransactionRepositories) => Promise<T>): Promise<T>;
}
