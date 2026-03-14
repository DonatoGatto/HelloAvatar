-- AlterTable
ALTER TABLE "avatars" ADD COLUMN     "simliEaceId" TEXT,
ADD COLUMN     "ttsVoice" TEXT;

-- AlterTable
ALTER TABLE "widget_configs" ADD COLUMN     "ttsVoice" TEXT NOT NULL DEFAULT 'en-US-JennyNeural';
