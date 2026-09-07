import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';

const stableKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parsePromoteAdminArgs(args: string[]): string {
  const key = args.length === 2 && args[0] === '--key' ? args[1] : undefined;
  if (!key || !stableKeyPattern.test(key)) {
    throw new Error('Usage: pnpm users:promote-admin --key <user-key>');
  }
  return key;
}

export async function promoteUserByKey(prisma: Pick<PrismaClient, 'user'>, key: string) {
  const user = await prisma.user.findUnique({ where: { key }, select: { key: true, role: true } });
  if (!user) throw new Error(`Usuário ${key} não encontrado`);
  if (user.role === UserRole.ADMIN) return user;
  return prisma.user.update({
    where: { key },
    data: { role: UserRole.ADMIN },
    select: { key: true, role: true },
  });
}

async function runPromoteAdmin() {
  const key = parsePromoteAdminArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) loadEnvironment({ path: resolve(__dirname, '../.env'), quiet: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL é obrigatório para promover um administrador');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const user = await promoteUserByKey(prisma, key);
    console.log(`Usuário ${user.key} está com papel ${user.role}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runPromoteAdmin().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha ao promover administrador');
    process.exitCode = 1;
  });
}
