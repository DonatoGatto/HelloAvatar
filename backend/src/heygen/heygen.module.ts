import { Global, Module } from '@nestjs/common';
import { HeygenService } from './heygen.service';

@Global()
@Module({
  providers: [HeygenService],
  exports: [HeygenService],
})
export class HeygenModule {}
