import { Module } from '@nestjs/common'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { SessionsService } from './sessions.service'
import { MultiReviewService } from './multi-review.service'
import { VariantsService } from './variants.service'
import { AIModule } from '../ai.module'

@Module({
  imports: [AIModule],
  controllers: [AgentController],
  providers: [AgentService, SessionsService, MultiReviewService, VariantsService],
})
export class AgentModule {}