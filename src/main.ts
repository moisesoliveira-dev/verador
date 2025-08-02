import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });

  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false
  }));

  // CORS para desenvolvimento e produção
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  });

  // Prefixo global para APIs
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;

  await app.listen(port);

  logger.log(`🚀 Verador Chatbot rodando na porta ${port}`);
  logger.log(`📋 API disponível em: http://localhost:${port}/api/v1`);
  logger.log(`🤖 Chatbot endpoint: http://localhost:${port}/api/v1/chatbot/message`);
  logger.log(`📊 Health check: http://localhost:${port}/api/v1/chatbot/health`);
  logger.log(`📈 Stats: http://localhost:${port}/api/v1/chatbot/stats`);
}

bootstrap();
