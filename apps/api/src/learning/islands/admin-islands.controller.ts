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
  createIslandInputSchema,
  publishContentInputSchema,
  reorderIslandsInputSchema,
  unpublishContentInputSchema,
  updateIslandInputSchema,
} from '@codelife/contracts/content-management';
import type {
  AdminIslandDetail,
  AdminIslandTreeItem,
  CreateIslandInput,
  PublishContentInput,
  ReorderIslandsInput,
  UnpublishContentInput,
  UpdateIslandInput,
} from '@codelife/contracts/content-management';
import { IslandIdParamDto } from '../dto';
import { AdminIslandsService } from './admin-islands.service';
import { ContentOrderService } from '../content-management/content-order.service';

@ApiTags('admin-content')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/content/islands')
export class AdminIslandsController {
  constructor(
    private readonly islandsService: AdminIslandsService,
    private readonly orderService: ContentOrderService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova ilha em rascunho' })
  @ApiResponse({ status: 201, description: 'Ilha criada com sucesso' })
  create(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Body(new ZodValidationPipe(createIslandInputSchema)) input: CreateIslandInput,
  ): Promise<AdminIslandDetail> {
    return this.islandsService.create(input, { actorId, requestId: req?.requestId });
  }

  @Put('order')
  @ApiOperation({ summary: 'Reordena a sequência de ilhas' })
  @ApiResponse({ status: 200, description: 'Ilhas reordenadas com sucesso' })
  reorder(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Body(new ZodValidationPipe(reorderIslandsInputSchema)) input: ReorderIslandsInput,
  ): Promise<AdminIslandTreeItem[]> {
    return this.orderService.reorderIslands(input, { actorId, requestId: req?.requestId });
  }

  @Get(':islandId')
  @ApiOperation({ summary: 'Obtém detalhes administrativos de uma ilha' })
  @ApiResponse({ status: 200, description: 'Detalhes da ilha' })
  detail(@Param() params: IslandIdParamDto): Promise<AdminIslandDetail> {
    return this.islandsService.getDetail(params.islandId);
  }

  @Patch(':islandId')
  @ApiOperation({ summary: 'Atualiza metadados de uma ilha' })
  @ApiResponse({ status: 200, description: 'Ilha atualizada com sucesso' })
  update(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
    @Body(new ZodValidationPipe(updateIslandInputSchema)) input: UpdateIslandInput,
  ): Promise<AdminIslandDetail> {
    return this.islandsService.update(params.islandId, input, { actorId, requestId: req?.requestId });
  }

  @Delete(':islandId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui uma ilha em rascunho e seus agregados descendentes' })
  @ApiResponse({ status: 204, description: 'Ilha excluída com sucesso' })
  delete(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
  ): Promise<void> {
    return this.islandsService.delete(params.islandId, { actorId, requestId: req?.requestId });
  }

  @Post(':islandId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica uma ilha que possua ao menos um nível publicado' })
  @ApiResponse({ status: 200, description: 'Ilha publicada com sucesso' })
  publish(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
    @Body(new ZodValidationPipe(publishContentInputSchema)) input: PublishContentInput,
  ): Promise<AdminIslandDetail> {
    return this.islandsService.publish(params.islandId, input, { actorId, requestId: req?.requestId });
  }

  @Post(':islandId/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despublica uma ilha sem progresso registrado' })
  @ApiResponse({ status: 200, description: 'Ilha despublicada com sucesso' })
  unpublish(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: IslandIdParamDto,
    @Body(new ZodValidationPipe(unpublishContentInputSchema)) input: UnpublishContentInput,
  ): Promise<AdminIslandDetail> {
    return this.islandsService.unpublish(params.islandId, input, { actorId, requestId: req?.requestId });
  }
}
