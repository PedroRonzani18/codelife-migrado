import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@/auth/decorators';
import { ZodValidationPipe } from '@/common/http';
import type { RequestWithContext } from '@/common/observability/request-context';
import {
  createLevelInputSchema,
  publishContentInputSchema,
  reorderLevelsInputSchema,
  unpublishContentInputSchema,
  updateLevelInputSchema,
} from '@codelife/contracts/content-management';
import type {
  AdminLevelDetail,
  AdminLevelTreeItem,
  CreateLevelInput,
  PublishContentInput,
  ReorderLevelsInput,
  UnpublishContentInput,
  UpdateLevelInput,
} from '@codelife/contracts/content-management';
import { IslandIdParamDto, LevelIdParamDto } from '../dto';
import { AdminLevelsService } from './admin-levels.service';
import { ContentOrderService } from '../content-management/content-order.service';

@ApiTags('admin-content')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/content')
export class AdminLevelsController {
  constructor(
    private readonly levelsService: AdminLevelsService,
    private readonly orderService: ContentOrderService,
  ) {}

  @Post('islands/:islandId/levels')
  @ApiOperation({ summary: 'Cria um novo nível em rascunho para uma ilha' })
  @ApiResponse({ status: 201, description: 'Nível criado com sucesso' })
  create(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
    @Body(new ZodValidationPipe(createLevelInputSchema)) input: CreateLevelInput,
  ): Promise<AdminLevelDetail> {
    return this.levelsService.create(params.islandId, input, { actorId, requestId: req?.requestId });
  }

  @Put('islands/:islandId/levels/order')
  @ApiOperation({ summary: 'Reordena os níveis dentro de uma ilha' })
  @ApiResponse({ status: 200, description: 'Níveis reordenados com sucesso' })
  reorder(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
    @Body(new ZodValidationPipe(reorderLevelsInputSchema)) input: ReorderLevelsInput,
  ): Promise<AdminLevelTreeItem[]> {
    return this.orderService.reorderLevels(params.islandId, input, { actorId, requestId: req?.requestId });
  }

  @Get('levels/:levelId')
  @ApiOperation({ summary: 'Obtém detalhes administrativos de um nível' })
  @ApiResponse({ status: 200, description: 'Detalhes do nível' })
  detail(@Param() params: LevelIdParamDto): Promise<AdminLevelDetail> {
    return this.levelsService.getDetail(params.levelId);
  }

  @Patch('levels/:levelId')
  @ApiOperation({ summary: 'Atualiza o título de um nível' })
  @ApiResponse({ status: 200, description: 'Nível atualizado com sucesso' })
  update(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
    @Body(new ZodValidationPipe(updateLevelInputSchema)) input: UpdateLevelInput,
  ): Promise<AdminLevelDetail> {
    return this.levelsService.update(params.levelId, input, { actorId, requestId: req?.requestId });
  }

  @Delete('levels/:levelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um nível em rascunho e seus slides' })
  @ApiResponse({ status: 204, description: 'Nível excluído com sucesso' })
  delete(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
  ): Promise<void> {
    return this.levelsService.delete(params.levelId, { actorId, requestId: req?.requestId });
  }

  @Post('levels/:levelId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica um nível que possua ao menos um slide' })
  @ApiResponse({ status: 200, description: 'Nível publicado com sucesso' })
  publish(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
    @Body(new ZodValidationPipe(publishContentInputSchema)) input: PublishContentInput,
  ): Promise<AdminLevelDetail> {
    return this.levelsService.publish(params.levelId, input, { actorId, requestId: req?.requestId });
  }

  @Post('levels/:levelId/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despublica um nível sem progresso registrado' })
  @ApiResponse({ status: 200, description: 'Nível despublicado com sucesso' })
  unpublish(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
    @Body(new ZodValidationPipe(unpublishContentInputSchema)) input: UnpublishContentInput,
  ): Promise<AdminLevelDetail> {
    return this.levelsService.unpublish(params.levelId, input, { actorId, requestId: req?.requestId });
  }
}
