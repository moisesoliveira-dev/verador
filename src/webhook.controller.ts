import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { GosacService } from './gosac/gosac.service';
import { ChatbotService } from './chatbot/services/chatbot.service';
import { GosacWebhookPayload } from './gosac/gosac.interface';

/**
 * Controller para receber webhooks do GOSAC
 */
@Controller('api/webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private readonly gosacService: GosacService,
        private readonly chatbotService: ChatbotService,
    ) { }

    /**
     * Endpoint para receber webhooks do GOSAC
     */
    @Post('gosac')
    @HttpCode(HttpStatus.OK)
    async handleGosacWebhook(@Body() payload: GosacWebhookPayload): Promise<{ success: boolean; message: string }> {
        this.logger.debug(`Webhook recebido: ${payload.type}`);

        try {
            // Processa o webhook através do GosacService
            const processedData = await this.gosacService.processWebhook(payload);

            if (!processedData) {
                this.logger.warn('Webhook processado mas sem dados válidos');
                return {
                    success: true,
                    message: 'Webhook recebido mas sem processamento necessário'
                };
            }

            // Se deve processar a mensagem, envia para o chatbot
            if (processedData.shouldProcess) {
                this.logger.debug(`Enviando mensagem para chatbot: ${processedData.contactNumber}`);

                await this.chatbotService.processMessage(
                    processedData.contactNumber,
                    processedData.body
                );

                return {
                    success: true,
                    message: 'Webhook processado e mensagem enviada ao chatbot'
                };
            } else {
                this.logger.debug(`Mensagem não processada pelo chatbot: ${processedData.reason}`);

                return {
                    success: true,
                    message: `Webhook recebido mas não processado: ${processedData.reason}`
                };
            }
        } catch (error) {
            this.logger.error('Erro ao processar webhook:', error);

            return {
                success: false,
                message: 'Erro interno ao processar webhook'
            };
        }
    }

    /**
     * Endpoint para testar webhooks (desenvolvimento)
     */
    @Post('test')
    @HttpCode(HttpStatus.OK)
    async testWebhook(@Body() payload: any): Promise<{ success: boolean; data: any }> {
        this.logger.debug('Webhook de teste recebido');

        return {
            success: true,
            data: {
                received: payload,
                timestamp: new Date().toISOString(),
                message: 'Webhook de teste processado com sucesso'
            }
        };
    }
}
