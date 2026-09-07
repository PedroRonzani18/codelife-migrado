import { Body, Controller, Get, Inject, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@/auth/decorators';
import { USERS_PROVIDER_KEYS } from '../../constants';
import { AdminUserResponseDto, UpdateUserRoleDto, UserKeyParamDto } from '../../dto';
import { GetAdminUsersEndpoint, UpdateAdminUserRoleEndpoint } from '../decorators/admin-users-endpoint.decorators';
import type { IAdminUsersService } from '../../service/admin-users/admin-users.service.interface';

@ApiTags('admin-users')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @Inject(USERS_PROVIDER_KEYS.ADMIN_USERS_SERVICE)
    private readonly users: IAdminUsersService,
  ) {}

  @Get()
  @GetAdminUsersEndpoint()
  list(): Promise<AdminUserResponseDto[]> {
    return this.users.list();
  }

  @Patch(':userKey/role')
  @UpdateAdminUserRoleEndpoint()
  updateRole(
    @CurrentUser('id') actorId: string,
    @Param() params: UserKeyParamDto,
    @Body() input: UpdateUserRoleDto,
  ) {
    return this.users.updateRole(actorId, params.userKey, input);
  }
}
