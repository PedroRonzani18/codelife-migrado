export type IdentityProvider = 'GOOGLE';

export interface ExternalIdentityRecord {
  id: string;
  provider: IdentityProvider;
  subject: string;
  userId: string;
  email: string | null;
  emailVerified: boolean | null;
}

export interface CreateExternalIdentityInput {
  provider: IdentityProvider;
  subject: string;
  userId: string;
  email?: string;
  emailVerified?: boolean;
}

export interface IExternalIdentitiesRepository {
  findByProviderAndSubject(
    provider: IdentityProvider,
    subject: string,
  ): Promise<ExternalIdentityRecord | null>;
  create(input: CreateExternalIdentityInput): Promise<ExternalIdentityRecord>;
}
