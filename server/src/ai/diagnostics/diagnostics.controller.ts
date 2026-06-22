import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { DiagnosticsService, type DiagnosticReport } from './diagnostics.service'

interface RunRequestBody {
  pageSettings: Record<string, any>
  components: Array<{ id: string; type: string; content?: any; styles?: any }>
}

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnostics: DiagnosticsService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async run(@Body() body: RunRequestBody): Promise<{ ok: boolean; report?: DiagnosticReport; error?: string }> {
    try {
      const report = this.diagnostics.run({
        pageSettings: body.pageSettings || {},
        components: body.components || [],
      })
      return { ok: true, report }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
}