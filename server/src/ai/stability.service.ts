import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ImageProxyDto, StabilityResponse } from './ai.dto'

const STABILITY_URL =
  'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image'

@Injectable()
export class StabilityService {
  private readonly logger = new Logger(StabilityService.name)
  private readonly apiKey: string | undefined

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('STABILITY_API_KEY')?.trim() || undefined
    if (!this.apiKey) {
      this.logger.warn('STABILITY_API_KEY not set — image generation will fail until configured.')
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10
  }

  async generate(dto: ImageProxyDto): Promise<{ dataUrl: string }> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Stability API key not configured on server. Set STABILITY_API_KEY in server/.env.',
      )
    }

    const body = {
      text_prompts: [{ text: dto.prompt, weight: 1 }],
      cfg_scale: dto.cfg_scale ?? 7,
      height: dto.height ?? 1024,
      width: dto.width ?? 1024,
      steps: dto.steps ?? 30,
      samples: 1,
    }

    let res: Response
    try {
      res = await fetch(STABILITY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey!}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      this.logger.error('Network error reaching Stability', err)
      throw new ServiceUnavailableException(
        `Failed to reach Stability API: ${(err as Error).message}`,
      )
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      this.logger.error(`Stability ${res.status}: ${errText.slice(0, 300)}`)
      throw new ServiceUnavailableException(
        `Stability API ${res.status}: ${errText.slice(0, 200) || res.statusText}`,
      )
    }

    const data = (await res.json()) as StabilityResponse
    const first = data.artifacts?.[0]
    if (!first?.base64) {
      throw new ServiceUnavailableException('Stability API returned no image artifacts')
    }
    return { dataUrl: `data:image/png;base64,${first.base64}` }
  }
}