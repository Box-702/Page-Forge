import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common'
import { ClaudeService } from './claude.service'
import { StabilityService } from './stability.service'
import { ClaudeProxyDto, ImageProxyDto } from './ai.dto'

@Controller('ai')
export class AIController {
  constructor(
    private readonly claudeSvc: ClaudeService,
    private readonly stabilitySvc: StabilityService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      providers: {
        anthropic: this.claudeSvc.isConfigured(),
        stability: this.stabilitySvc.isConfigured(),
      },
    }
  }

  @Post('claude')
  @HttpCode(HttpStatus.OK)
  async claude(@Body() dto: ClaudeProxyDto) {
    return this.claudeSvc.call(dto)
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  async image(@Body() dto: ImageProxyDto) {
    return this.stabilitySvc.generate(dto)
  }
}