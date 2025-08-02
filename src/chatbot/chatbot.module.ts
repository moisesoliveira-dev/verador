import { Module } from '@nestjs/common';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { ConversationStateService } from './services/conversation-state.service';
import { ValidationService } from './services/validation.service';
import { FlowService } from './services/flow.service';

@Module({
    controllers: [ChatbotController],
    providers: [
        ChatbotService,
        ConversationStateService,
        ValidationService,
        FlowService
    ],
    exports: [
        ChatbotService,
        ConversationStateService,
        ValidationService,
        FlowService
    ]
})
export class ChatbotModule { }
