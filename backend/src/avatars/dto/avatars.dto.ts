import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddStockAvatarDto {
  @ApiProperty()
  @IsString()
  heygenAvatarId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previewVideoUrl?: string;
}

export class CreateCustomAvatarDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'S3 URL of uploaded video' })
  @IsString()
  sourceVideoUrl: string;
}

export class UpdateAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
