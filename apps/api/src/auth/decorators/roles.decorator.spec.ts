import 'reflect-metadata';
import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('stores the required roles as route metadata', () => {
    class TestController {}

    Roles('ADMIN')(TestController);

    expect(Reflect.getMetadata(ROLES_KEY, TestController)).toEqual(['ADMIN']);
  });
});
