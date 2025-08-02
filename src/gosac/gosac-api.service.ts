import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
    GosacWebhookPayload,
    GosacMessage,
    GosacApiResponse,
    GosacSendMessageRequest,
    GosacTicketUpdateRequest
} from './gosac-webhook.interface';

@Injectable()
export class GosacApiService {
    private readonly logger = new Logger(GosacApiService.name);
    private readonly httpClient: AxiosInstance;
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('GOSAC_API_URL', 'https://api.gosac.com');
        this.apiKey = this.configService.get<string>('GOSAC_API_KEY', '');

        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Interceptors para logs
        this.setupInterceptors();
    }

    /**
     * Envia mensagem através da API do GOSAC
     */
    async sendMessage(request: GosacSendMessageRequest): Promise<GosacApiResponse> {
        try {
            this.logger.debug(`Enviando mensagem para ${request.number}: ${request.body.substring(0, 100)}...`);

            const response = await this.httpClient.post('/messages/send', {
                number: request.number,
                body: request.body,
                ...(request.mediaPath && { mediaPath: request.mediaPath }),
                ...(request.mediaUrl && { mediaUrl: request.mediaUrl })
            });

            this.logger.log(`Mensagem enviada com sucesso para ${request.number}`);

            return {
                success: true,
                data: response.data,
                message: 'Mensagem enviada com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao enviar mensagem para ${request.number}:`, error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao enviar mensagem'
            };
        }
    }

    /**
     * Atualiza status de um ticket
     */
    async updateTicket(request: GosacTicketUpdateRequest): Promise<GosacApiResponse> {
        try {
            this.logger.debug(`Atualizando ticket ${request.ticketId}`);

            const updateData: any = {};
            if (request.status) updateData.status = request.status;
            if (request.userId) updateData.userId = request.userId;
            if (request.queueId) updateData.queueId = request.queueId;

            const response = await this.httpClient.patch(`/tickets/${request.ticketId}`, updateData);

            this.logger.log(`Ticket ${request.ticketId} atualizado com sucesso`);

            return {
                success: true,
                data: response.data,
                message: 'Ticket atualizado com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao atualizar ticket ${request.ticketId}:`, error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao atualizar ticket'
            };
        }
    }

    /**
     * Obtém informações de um ticket
     */
    async getTicket(ticketId: number): Promise<GosacApiResponse> {
        try {
            this.logger.debug(`Buscando ticket ${ticketId}`);

            const response = await this.httpClient.get(`/tickets/${ticketId}`);

            return {
                success: true,
                data: response.data,
                message: 'Ticket obtido com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao buscar ticket ${ticketId}:`, error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao obter ticket'
            };
        }
    }

    /**
     * Verifica se uma mensagem deve ser processada pelo chatbot
     */
    shouldProcessMessage(message: GosacMessage): boolean {
        // Não processa mensagens enviadas por atendentes
        if (message.fromMe) {
            this.logger.debug(`Mensagem ignorada - enviada por atendente no ticket ${message.ticketId}`);
            return false;
        }

        // Não processa mensagens de grupos
        if (message.fromGroup) {
            this.logger.debug(`Mensagem ignorada - enviada em grupo no ticket ${message.ticketId}`);
            return false;
        }

        // Só processa mensagens de chat ou com mídia
        if (message.mediaType !== 'chat' && !message.mediaPath) {
            this.logger.debug(`Mensagem ignorada - tipo ${message.mediaType} sem mídia no ticket ${message.ticketId}`);
            return false;
        }

        // Não processa se já tem atendente designado
        if (message.ticket.userId) {
            this.logger.debug(`Mensagem ignorada - ticket ${message.ticketId} já tem atendente designado (ID: ${message.ticket.userId})`);
            return false;
        }

        // Não processa se ticket está fechado
        if (message.ticket.status === 'closed') {
            this.logger.debug(`Mensagem ignorada - ticket ${message.ticketId} está fechado`);
            return false;
        }

        return true;
    }

    /**
     * Extrai dados importantes da mensagem para processamento
     */
    extractMessageData(message: GosacMessage) {
        return {
            userId: message.contactId.toString(),
            message: message.body || '',
            ticketId: message.ticketId,
            contactName: message.contact.name,
            contactNumber: message.contact.number,
            mediaPath: message.mediaPath,
            mediaType: message.mediaType,
            timestamp: new Date(message.createdAt),
            isGroup: message.fromGroup,
            ticketStatus: message.ticket.status,
            queueId: message.ticket.queueId
        };
    }

    /**
     * Verifica conectividade com a API do GOSAC
     */
    async checkConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
        try {
            const startTime = Date.now();
            await this.httpClient.get('/health');
            const latency = Date.now() - startTime;

            return {
                connected: true,
                latency
            };

        } catch (error) {
            this.logger.error('Erro ao verificar conexão com GOSAC:', error.message);

            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Configura interceptors para logs e tratamento de erros
     */
    private setupInterceptors(): void {
        this.httpClient.interceptors.request.use(
            (config) => {
                this.logger.debug(`GOSAC API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.logger.error('GOSAC API Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.httpClient.interceptors.response.use(
            (response) => {
                this.logger.debug(`GOSAC API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                const status = error.response?.status;
                const url = error.config?.url;
                this.logger.error(`GOSAC API Response Error: ${status} ${url}`, error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }
}
