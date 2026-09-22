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
  createSlideInputSchema,
  reorderSlidesInputSchema,
  updateSlideInputSchema,
} from '@codelife/contracts/content-management';
import type {
  AdminSlideDetail,
  AdminSlideTreeItem,
  CreateSlideInput,
  ReorderSlidesInput,
  UpdateSlideInput,
} from '@codelife/contracts/content-management';
import { LevelIdParamDto, SlideIdParamDto } from '../dto';
import { AdminSlidesService } from './admin-slides.service';
import { ContentOrderService } from '../content-management/content-order.service';

@ApiTags('admin-content')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/content')
export class AdminSlidesController {
  constructor(
    private readonly slidesService: AdminSlidesService,
    private readonly orderService: ContentOrderService,
  ) {}

  @Post('levels/:levelId/slides')
  @ApiOperation({ summary: 'Cria um novo slide para um nível' })
  @ApiResponse({ status: 201, description: 'Slide criado com sucesso' })
  create(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
    @Body(new ZodValidationPipe(createSlideInputSchema)) input: CreateSlideInput,
  ): Promise<AdminSlideDetail> {
    return this.slidesService.create(params.levelId, input, { actorId, requestId: req?.requestId });
  }

  @Put('levels/:levelId/slides/order')
  @ApiOperation({ summary: 'Reordena os slides dentro de um nível' })
  @ApiResponse({ status: 200, description: 'Slides reordenados com sucesso' })
  reorder(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: LevelIdParamDto,
    @Body(new ZodValidationPipe(reorderSlidesInputSchema)) input: ReorderSlidesInput,
  ): Promise<AdminSlideTreeItem[]> {
    return this.orderService.reorderSlides(params.levelId, input, { actorId, requestId: req?.requestId });
  }

  @Get('slides/:slideId')
  @ApiOperation({ summary: 'Obtém detalhes administrativos de um slide' })
  @ApiResponse({ status: 200, description: 'Detalhes do slide' })
  detail(@Param() params: SlideIdParamDto): Promise<AdminSlideDetail> {
    return this.slidesService.getDetail(params.slideId);
  }

  @Patch('slides/:slideId')
  @ApiOperation({ summary: 'Atualiza o conteúdo de um slide' })
  @ApiResponse({ status: 200, description: 'Slide atualizado com sucesso' })
  update(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: SlideIdParamDto,
    @Body(new ZodValidationPipe(updateSlideInputSchema)) input: UpdateSlideInput,
  ): Promise<AdminSlideDetail> {
    return this.slidesService.update(params.slideId, input, { actorId, requestId: req?.requestId });
  }

  @Delete('slides/:slideId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um slide de um nível em rascunho' })
  @ApiResponse({ status: 204, description: 'Slide excluído com sucesso' })
  delete(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @Param() params: SlideIdParamDto,
  ): Promise<void> {
    return this.slidesService.delete(params.slideId, { actorId, requestId: req?.requestId });
  }
}
