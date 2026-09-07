export const queryKeys = {
  session: {
    all: ['session'] as const,
  },
  adminUsers: {
    all: ['admin-users'] as const,
    list: ['admin-users', 'list'] as const,
  },
  learning: {
    all: ['learning'] as const,
    island: (slug: string) => ['learning', 'island', slug] as const,
    level: (levelId: string) => ['learning', 'level', levelId] as const,
  },
  progress: {
    all: ['progress'] as const,
    snapshot: ['progress', 'snapshot'] as const,
  },
} as const;
