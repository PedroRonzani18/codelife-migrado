import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@/auth/decorators';
import { AdminUserResponseDto, UpdateUserRoleDto, UserKeyParamDto } from '../dto';
import { UserManagementService } from '../management/user-management.service';
import { GetAdminUsersEndpoint, UpdateAdminUserRoleEndpoint } from './admin-users-endpoint.decorators';

@ApiTags('admin-users')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UserManagementService) {}

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
