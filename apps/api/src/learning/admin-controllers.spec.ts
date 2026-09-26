import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/auth/decorators';
import { AdminContentTreeController } from './content-management/admin-content-tree.controller';
import { AdminIslandsController } from './islands/admin-islands.controller';
import { AdminLevelsController } from './levels/admin-levels.controller';
import { AdminSlidesController } from './slides/admin-slides.controller';
import { AdminMediaController } from './media/admin-media.controller';

describe('Admin Controllers Role Protection', () => {
  const reflector = new Reflector();

  it.each([
    AdminContentTreeController,
    AdminIslandsController,
    AdminLevelsController,
    AdminSlidesController,
    AdminMediaController,
  ])('protects %p with ADMIN role at class level', (controllerClass) => {
    const roles = reflector.get(ROLES_KEY, controllerClass);
    expect(roles).toEqual(['ADMIN']);
  });
});
