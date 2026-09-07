import type { IExternalIdentitiesRepository } from './external-identities.repository.interface';
import type { IUsersRepository } from '../../users/repository/users.repository.interface';

export interface IdentityTransactionRepositories {
  users: IUsersRepository;
  externalIdentities: IExternalIdentitiesRepository;
}

export interface IIdentityTransaction {
  run<T>(operation: (repositories: IdentityTransactionRepositories) => Promise<T>): Promise<T>;
}
