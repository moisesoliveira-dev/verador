import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { GosacApiService } from './gosac-api.service';
import { ChatbotService } from '../chatbot/services/chatbot.service';
import type { GosacWebhookPayload } from './gosac-webhook.interface';

@Controller('gosac')
export class GosacWebhookController {
    private readonly logger = new Logger(GosacWebhookController.name);

    constructor(
        private readonly gosacApiService: GosacApiService,
        private readonly chatbotService: ChatbotService
    ) { }

    /**
     * Endpoint para receber webhooks do GOSAC
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() payload: GosacWebhookPayload): Promise<{ status: string; message?: string }> {
        try {
            this.logger.debug('Webhook recebido do GOSAC', JSON.stringify(payload, null, 2));

            // Verificar se é uma mensagem válida
            if (!payload || !payload.data || !payload.data.messageId) {
                this.logger.warn('Webhook inválido: payload sem dados de mensagem');
                return { status: 'ignored', message: 'Payload inválido' };
            }

            // Verificar se é do tipo mensagem
            if (payload.type !== 'messages:created') {
                this.logger.debug(`Evento ${payload.type} ignorado - processamos apenas messages:created`);
                return { status: 'ignored', message: 'Tipo de evento não processado' };
            }

            const message = payload.data;

            // Verificar se deve processar a mensagem
            if (!this.gosacApiService.shouldProcessMessage(message)) {
                this.logger.debug(`Mensagem ${message.messageId} ignorada pelos filtros`);
                return { status: 'ignored', message: 'Mensagem filtrada' };
            }

            // Extrair dados da mensagem
            const messageData = this.gosacApiService.extractMessageData(message);

            this.logger.log(`Processando mensagem ${message.messageId} do contato ${messageData.contactName} (${messageData.contactNumber})`);

            // Processar mensagem no chatbot
            const chatbotResponse = await this.chatbotService.processMessage(
                messageData.userId,
                messageData.message
            );

            // Enviar resposta via GOSAC se necessário
            if (chatbotResponse.message && messageData.contactNumber) {
                const sendResult = await this.gosacApiService.sendMessage({
                    number: messageData.contactNumber,
                    body: chatbotResponse.message
                });

                if (sendResult.success) {
                    this.logger.log(`Resposta enviada com sucesso para ${messageData.contactNumber}`);
                } else {
                    this.logger.error(`Falha ao enviar resposta: ${sendResult.error}`);
                }
            }

            // Atualizar ticket se necessário (manter aberto para bot)
            if (messageData.ticketId) {
                await this.gosacApiService.updateTicket({
                    ticketId: messageData.ticketId,
                    status: 'open'
                });
            }

            return {
                status: 'processed',
                message: `Mensagem ${message.messageId} processada com sucesso`
            };

        } catch (error) {
            this.logger.error('Erro ao processar webhook do GOSAC:', error);

            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Endpoint para teste de conectividade
     */
    @Post('health')
    @HttpCode(HttpStatus.OK)
    async healthCheck(): Promise<{ status: string; timestamp: string; gosac?: any }> {
        try {
            const gosacStatus = await this.gosacApiService.checkConnection();

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                gosac: gosacStatus
            };

        } catch (error) {
            this.logger.error('Erro no health check:', error);

            return {
                status: 'error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
