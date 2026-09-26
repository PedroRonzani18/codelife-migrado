import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/auth/decorators';
import type { AdminContentTree } from '@codelife/contracts/content-management';
import { AdminContentTreeService } from './admin-content-tree.service';

@ApiTags('admin-content')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/content')
export class AdminContentTreeController {
  constructor(private readonly treeService: AdminContentTreeService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Obtém a árvore completa de ilhas, níveis e slides para administração' })
  @ApiOkResponse({ description: 'Árvore de conteúdo retornada com sucesso' })
  getTree(): Promise<AdminContentTree> {
    return this.treeService.getTree();
  }
}
