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

  @ApiPropertyOptional({ description: 'Simli.ai face ID for live talking avatar' })
  @IsOptional()
  @IsString()
  simliEaceId?: string;

  @ApiPropertyOptional({ description: 'Edge TTS voice e.g. en-US-JennyNeural' })
  @IsOptional()
  @IsString()
  ttsVoice?: string;
}

export class CreateCustomAvatarDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL of uploaded video' })
  @IsString()
  sourceVideoUrl: string;

  @ApiPropertyOptional({ description: 'Simli.ai face ID' })
  @IsOptional()
  @IsString()
  simliEaceId?: string;

  @ApiPropertyOptional({ description: 'Edge TTS voice' })
  @IsOptional()
  @IsString()
  ttsVoice?: string;
}

export class UpdateAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Simli.ai face ID for live talking avatar' })
  @IsOptional()
  @IsString()
  simliEaceId?: string;

  @ApiPropertyOptional({ description: 'Edge TTS voice e.g. en-US-JennyNeural' })
  @IsOptional()
  @IsString()
  ttsVoice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
