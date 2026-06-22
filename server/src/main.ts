import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })
  const config = app.get(ConfigService)
  const port = parseInt(config.get<string>('PORT') ?? '3000', 10)
  const origins = (config.get<string>('CORS_ORIGINS') ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  })
  app.setGlobalPrefix('api')

  await app.listen(port, '0.0.0.0')
  const logger = new Logger('Bootstrap')
  logger.log(`Page Forge server listening on http://localhost:${port}`)
  logger.log(`CORS origins: ${origins.join(', ')}`)
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})