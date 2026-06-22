import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ImageProxyDto } from './ai.dto'

const STABILITY_URL =
  'https://api.stability.ai/v2beta/stable-image/generate/sd3'

interface StabilityV2Response {
  image?: string
  finish_reason?: string
  seed?: number
}

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

    // SD3 API uses multipart form data
    const formData = new FormData()
    formData.append('prompt', dto.prompt)
    formData.append('output_format', 'png')
    if (dto.width) formData.append('width', String(dto.width))
    if (dto.height) formData.append('height', String(dto.height))
    if (dto.cfg_scale) formData.append('cfg_scale', String(dto.cfg_scale))
    if (dto.steps) formData.append('steps', String(dto.steps))

    let res: Response
    try {
      res = await fetch(STABILITY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey!}`,
          Accept: 'application/json',
        },
        body: formData,
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

    const data = (await res.json()) as StabilityV2Response
    if (!data?.image) {
      throw new ServiceUnavailableException('Stability API returned no image data')
    }
    return { dataUrl: `data:image/png;base64,${data.image}` }
  }
}
