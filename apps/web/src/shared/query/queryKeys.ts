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
    catalog: ['learning', 'catalog'] as const,
    island: (slug: string) => ['learning', 'island', slug] as const,
    level: (levelId: string) => ['learning', 'level', levelId] as const,
  },
  progress: {
    all: ['progress'] as const,
    snapshot: ['progress', 'snapshot'] as const,
  },
  adminContent: {
    all: ['admin-content'] as const,
    tree: ['admin-content', 'tree'] as const,
    island: (id: string) => ['admin-content', 'island', id] as const,
    level: (id: string) => ['admin-content', 'level', id] as const,
    slide: (id: string) => ['admin-content', 'slide', id] as const,
  },
} as const;
