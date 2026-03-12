import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  script: string;

  @ApiProperty({ description: 'Avatar ID from your workspace' })
  @IsString()
  avatarId: string;

  @ApiPropertyOptional({ description: 'ElevenLabs or HeyGen voice ID' })
  @IsOptional()
  @IsString()
  voiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  background?: any;

  @ApiPropertyOptional({ default: false, description: 'Test mode does not consume credits' })
  @IsOptional()
  test?: boolean;
}
