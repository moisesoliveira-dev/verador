import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    UseGuards,
    ValidationPipe,
    HttpStatus,
    HttpException,
    Logger
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatbotService } from '../services/chatbot.service';
import { ConversationStateService } from '../services/conversation-state.service';
import { IncomingMessageDto, ChatbotResponseDto } from '../dto/chatbot.dto';

@Controller('chatbot')
@UseGuards(ThrottlerGuard)
export class ChatbotController {
    private readonly logger = new Logger(ChatbotController.name);

    constructor(
        private readonly chatbotService: ChatbotService,
        private readonly conversationState: ConversationStateService
    ) { }

    /**
     * Endpoint principal para receber mensagens
     */
    @Post('message')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 mensagens por minuto por IP
    async processMessage(
        @Body(new ValidationPipe()) messageDto: IncomingMessageDto
    ): Promise<ChatbotResponseDto> {
        try {
            this.logger.debug(`Mensagem recebida de ${messageDto.userId}: ${messageDto.message}`);

            const response = await this.chatbotService.processMessage(
                messageDto.userId,
                messageDto.message
            );

            this.logger.debug(`Resposta enviada para ${messageDto.userId}: ${response.message.substring(0, 100)}...`);

            return response;

        } catch (error) {
            this.logger.error(`Erro ao processar mensagem de ${messageDto.userId}:`, error);

            throw new HttpException(
                {
                    message: 'Erro interno do servidor. Tente novamente.',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Webhook para integração com GOSAC (placeholder)
     */
    @Post('webhook/gosac')
    async handleGosacWebhook(@Body() payload: any): Promise<{ success: boolean; message: string }> {
        try {
            this.logger.debug('Webhook GOSAC recebido:', JSON.stringify(payload));

            // TODO: Implementar processamento do webhook do GOSAC
            // Aqui você processará:
            // - Atualizações de status de tickets
            // - Novas mensagens
            // - Mudanças de estado dos clientes

            return {
                success: true,
                message: 'Webhook processado com sucesso'
            };

        } catch (error) {
            this.logger.error('Erro ao processar webhook GOSAC:', error);

            throw new HttpException(
                {
                    message: 'Erro ao processar webhook',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtém estado da conversa de um usuário
     */
    @Get('conversation/:userId')
    @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 consultas por minuto
    getConversationState(@Param('userId') userId: string) {
        try {
            const state = this.conversationState.getConversationState(userId);

            return {
                userId: state.userId,
                currentStep: state.currentStep,
                stepHistory: state.stepHistory,
                lastMessageTime: state.lastMessageTime,
                isActive: state.isActive,
                attempts: state.attempts,
                hasData: Object.keys(state.data).length > 0
            };

        } catch (error) {
            this.logger.error(`Erro ao obter estado da conversa para ${userId}:`, error);

            throw new HttpException(
                {
                    message: 'Erro ao obter estado da conversa',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Reinicia conversa de um usuário
     */
    @Post('conversation/:userId/restart')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 reinicializações por minuto
    restartConversation(@Param('userId') userId: string): { success: boolean; message: string } {
        try {
            this.conversationState.restartConversation(userId);
            this.logger.debug(`Conversa reiniciada para usuário: ${userId}`);

            return {
                success: true,
                message: 'Conversa reiniciada com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao reiniciar conversa para ${userId}:`, error);

            throw new HttpException(
                {
                    message: 'Erro ao reiniciar conversa',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtém histórico de mensagens de um usuário
     */
    @Get('conversation/:userId/history')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 consultas por minuto
    getMessageHistory(@Param('userId') userId: string) {
        try {
            const history = this.conversationState.getMessageHistory(userId);

            return {
                userId,
                messageCount: history.length,
                messages: history.map(msg => ({
                    message: msg.message,
                    timestamp: msg.timestamp,
                    type: msg.messageType
                }))
            };

        } catch (error) {
            this.logger.error(`Erro ao obter histórico para ${userId}:`, error);

            throw new HttpException(
                {
                    message: 'Erro ao obter histórico de mensagens',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtém estatísticas gerais do chatbot
     */
    @Get('stats')
    @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 consultas por minuto
    getStatistics() {
        try {
            return this.chatbotService.getStatistics();

        } catch (error) {
            this.logger.error('Erro ao obter estatísticas:', error);

            throw new HttpException(
                {
                    message: 'Erro ao obter estatísticas',
                    error: 'Internal Server Error'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Health check endpoint
     */
    @Get('health')
    @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 consultas por minuto
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date(),
            service: 'ChatbotService',
            version: '1.0.0'
        };
    }
}
