import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomAvatarDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'S3 URL of the uploaded source video' })
  @IsString()
  sourceVideoUrl: string;
}

export class UpdateAvatarDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class AddStockAvatarDto {
  @ApiProperty({ description: 'HeyGen avatar_id from the stock library' })
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
