import { Module } from '@nestjs/common'
import { AIController } from './ai.controller'
import { ClaudeService } from './claude.service'
import { StabilityService } from './stability.service'

@Module({
  controllers: [AIController],
  providers: [ClaudeService, StabilityService],
  exports: [ClaudeService, StabilityService],
})
export class AIModule {}