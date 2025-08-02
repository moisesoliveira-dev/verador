import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotModule } from './chatbot/chatbot.module';
import { GosacModule } from './gosac/gosac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto
      limit: 30, // 30 requests por minuto por IP (padrão)
    }]),
    ChatbotModule,
    GosacModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
