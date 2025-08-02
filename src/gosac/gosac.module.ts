import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GosacApiService } from './gosac-api.service';
import { GosacWebhookController } from './gosac-webhook.controller';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
    imports: [
        ConfigModule,
        ChatbotModule
    ],
    controllers: [GosacWebhookController],
    providers: [GosacApiService],
    exports: [GosacApiService]
})
export class GosacModule { }
