import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AIModule } from './ai/ai.module'
import { AgentModule } from './ai/agent/agent.module'
import { DiagnosticsModule } from './ai/diagnostics/diagnostics.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AIModule,
    AgentModule,
    DiagnosticsModule,
  ],
})
export class AppModule {}