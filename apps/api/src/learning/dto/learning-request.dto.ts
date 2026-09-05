import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

const stableKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class IslandKeyParamDto {
  @ApiProperty({ example: 'island-3', description: 'Slug estável da ilha controlada.' })
  @Matches(stableKeyPattern)
  islandKey!: string;
}

export class LevelIdParamDto {
  @ApiProperty({ format: 'uuid', description: 'UUID público do nível.' })
  @IsUUID()
  levelId!: string;
}

export class MediaAssetIdParamDto {
  @ApiProperty({ format: 'uuid', description: 'UUID público do ativo de mídia.' })
  @IsUUID()
  mediaAssetId!: string;
}

export class StartLevelInputDto {}

export class CompleteLevelInputDto {}

export class UpdateCurrentSlideInputDto {
  @ApiProperty({ format: 'uuid', description: 'UUID do slide de destino.' })
  @IsUUID()
  slideId!: string;
}
