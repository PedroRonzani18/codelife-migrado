import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';

export class LevelProgressResponseDto {
  @ApiProperty({ format: 'uuid' })
  currentSlideId!: string;

  @ApiProperty({ format: 'date-time' })
  startedAt!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  completedAt!: string | null;
}

export class LevelSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ minimum: 1 })
  position!: number;

  @ApiProperty({ enum: ['available', 'in_progress', 'blocked', 'completed'] })
  availability!: string;
}

export class IslandCatalogItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'island-3' })
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ minimum: 1 })
  position!: number;

  @ApiProperty({ minimum: 0 })
  levelCount!: number;

  @ApiProperty({ enum: ['available', 'in_progress', 'blocked', 'completed'] })
  availability!: string;
}

export class IslandDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'island-3' })
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ minimum: 0 })
  levelCount!: number;

  @ApiPropertyOptional({ enum: ['available', 'in_progress', 'blocked', 'completed'] })
  availability?: string;

  @ApiProperty({ type: [LevelSummaryResponseDto] })
  levels!: LevelSummaryResponseDto[];
}

export class MediaAssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  objectKey!: string;

  @ApiProperty({ example: 'image/svg+xml' })
  mimeType!: string;

  @ApiPropertyOptional({ nullable: true })
  sizeBytes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  width!: number | null;

  @ApiPropertyOptional({ nullable: true })
  height!: number | null;

  @ApiPropertyOptional({ nullable: true })
  checksum!: string | null;
}

export class TextTextSlideResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() position!: number;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) previousSlideId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) nextSlideId!: string | null;
  @ApiProperty({ enum: ['TextText'] }) type!: 'TextText';
  @ApiProperty() primaryText!: string;
  @ApiPropertyOptional({ nullable: true }) secondaryText!: string | null;
}

export class TextImageSlideResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() position!: number;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) previousSlideId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) nextSlideId!: string | null;
  @ApiProperty({ enum: ['TextImage'] }) type!: 'TextImage';
  @ApiProperty() text!: string;
  @ApiProperty() altText!: string;
  @ApiProperty({ type: MediaAssetResponseDto }) mediaAsset!: MediaAssetResponseDto;
}

export class TextCodeSlideResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() position!: number;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) previousSlideId!: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) nextSlideId!: string | null;
  @ApiProperty({ enum: ['TextCode'] }) type!: 'TextCode';
  @ApiProperty() text!: string;
  @ApiProperty() code!: string;
  @ApiProperty() language!: string;
}

export class LevelDetailResponseDto extends LevelSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  islandId!: string;

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(TextTextSlideResponseDto) },
        { $ref: getSchemaPath(TextImageSlideResponseDto) },
        { $ref: getSchemaPath(TextCodeSlideResponseDto) },
      ],
    },
  })
  slides!: Array<TextTextSlideResponseDto | TextImageSlideResponseDto | TextCodeSlideResponseDto>;
}

export class LastVisitedResponseDto {
  @ApiProperty({ format: 'uuid' }) islandId!: string;
  @ApiProperty({ format: 'uuid' }) levelId!: string;
  @ApiProperty({ format: 'uuid' }) slideId!: string;
}

export class NextRecommendedResponseDto {
  @ApiProperty({ format: 'uuid' }) levelId!: string;
  @ApiProperty({ format: 'uuid' }) slideId!: string;
}

export class IslandProgressResponseDto {
  @ApiProperty({ format: 'uuid' }) currentLevelId!: string;
  @ApiProperty({ format: 'date-time' }) startedAt!: string;
}

export class LevelProgressSnapshotResponseDto extends LevelSummaryResponseDto {
  @ApiPropertyOptional({ type: LevelProgressResponseDto, nullable: true })
  progress!: LevelProgressResponseDto | null;
}

export class IslandProgressSnapshotResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() levelCount!: number;
  @ApiPropertyOptional({ type: IslandProgressResponseDto, nullable: true }) progress!: IslandProgressResponseDto | null;
  @ApiProperty({ type: [LevelProgressSnapshotResponseDto] }) levels!: LevelProgressSnapshotResponseDto[];
}

export class ProgressSnapshotResponseDto {
  @ApiPropertyOptional({ type: LastVisitedResponseDto, nullable: true }) lastVisited!: LastVisitedResponseDto | null;
  @ApiPropertyOptional({ type: NextRecommendedResponseDto, nullable: true }) nextRecommended!: NextRecommendedResponseDto | null;
  @ApiProperty({ type: [IslandProgressSnapshotResponseDto] }) islands!: IslandProgressSnapshotResponseDto[];
}
