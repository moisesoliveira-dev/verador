import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
    GosacMessage,
    GosacTicket,
    GosacApiResponse,
    GosacWebhookPayload
} from './gosac.interface';

@Injectable()
export class GosacService {
    private readonly logger = new Logger(GosacService.name);
    private readonly httpClient: AxiosInstance;
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('GOSAC_API_URL', 'https://api.gosac.com');
        this.apiKey = this.configService.get<string>('GOSAC_API_KEY', '');

        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Interceptor para logs
        this.httpClient.interceptors.request.use(
            (config) => {
                this.logger.debug(`GOSAC Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.logger.error('GOSAC Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.httpClient.interceptors.response.use(
            (response) => {
                this.logger.debug(`GOSAC Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.logger.error('GOSAC Response Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Envia mensagem através da API do GOSAC
     */
    async sendMessage(message: GosacMessage): Promise<GosacApiResponse> {
        try {
            this.logger.debug(`Enviando mensagem para ${message.to}: ${message.message.substring(0, 50)}...`);

            const response = await this.httpClient.post('/messages/send', {
                to: message.to,
                message: message.message,
                type: message.type || 'text',
                ...(message.mediaUrl && { mediaUrl: message.mediaUrl })
            });

            return {
                success: true,
                data: response.data,
                message: 'Mensagem enviada com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao enviar mensagem para ${message.to}:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao enviar mensagem'
            };
        }
    }

    /**
     * Cria um novo ticket no GOSAC
     */
    async createTicket(ticketData: Partial<GosacTicket>): Promise<GosacApiResponse<GosacTicket>> {
        try {
            this.logger.debug(`Criando ticket para usuário ${ticketData.userId}`);

            const response = await this.httpClient.post('/tickets', {
                userId: ticketData.userId,
                subject: ticketData.subject,
                description: ticketData.description,
                priority: ticketData.priority || 'medium',
                status: 'open'
            });

            return {
                success: true,
                data: response.data,
                message: 'Ticket criado com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao criar ticket:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao criar ticket'
            };
        }
    }

    /**
     * Atualiza status de um ticket
     */
    async updateTicketStatus(
        ticketId: string,
        status: GosacTicket['status'],
        userId?: string
    ): Promise<GosacApiResponse<GosacTicket>> {
        try {
            this.logger.debug(`Atualizando ticket ${ticketId} para status: ${status}`);

            const response = await this.httpClient.patch(`/tickets/${ticketId}`, {
                status,
                ...(userId && { assignedTo: userId }),
                updatedAt: new Date()
            });

            return {
                success: true,
                data: response.data,
                message: 'Status do ticket atualizado com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao atualizar ticket ${ticketId}:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao atualizar status do ticket'
            };
        }
    }

    /**
     * Lista tickets de um usuário
     */
    async getUserTickets(userId: string): Promise<GosacApiResponse<GosacTicket[]>> {
        try {
            this.logger.debug(`Buscando tickets do usuário ${userId}`);

            const response = await this.httpClient.get(`/tickets/user/${userId}`);

            return {
                success: true,
                data: response.data,
                message: 'Tickets obtidos com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao buscar tickets do usuário ${userId}:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao obter tickets'
            };
        }
    }

    /**
     * Obtém detalhes de um ticket específico
     */
    async getTicket(ticketId: string): Promise<GosacApiResponse<GosacTicket>> {
        try {
            this.logger.debug(`Buscando ticket ${ticketId}`);

            const response = await this.httpClient.get(`/tickets/${ticketId}`);

            return {
                success: true,
                data: response.data,
                message: 'Ticket obtido com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao buscar ticket ${ticketId}:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao obter ticket'
            };
        }
    }

    /**
     * Atualiza status de um cliente/usuário
     */
    async updateUserStatus(userId: string, status: string, metadata?: Record<string, any>): Promise<GosacApiResponse> {
        try {
            this.logger.debug(`Atualizando status do usuário ${userId} para: ${status}`);

            const response = await this.httpClient.patch(`/users/${userId}/status`, {
                status,
                ...(metadata && { metadata }),
                updatedAt: new Date()
            });

            return {
                success: true,
                data: response.data,
                message: 'Status do usuário atualizado com sucesso'
            };

        } catch (error) {
            this.logger.error(`Erro ao atualizar status do usuário ${userId}:`, error);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                message: 'Falha ao atualizar status do usuário'
            };
        }
    }

    /**
     * Processa webhook recebido do GOSAC
     */
    async processWebhook(payload: GosacWebhookPayload): Promise<void> {
        try {
            this.logger.debug(`Processando webhook GOSAC: ${payload.type} para usuário ${payload.userId}`);

            switch (payload.type) {
                case 'message':
                    await this.handleIncomingMessage(payload);
                    break;

                case 'ticket_update':
                    await this.handleTicketUpdate(payload);
                    break;

                case 'status_change':
                    await this.handleStatusChange(payload);
                    break;

                default:
                    this.logger.warn(`Tipo de webhook não reconhecido: ${payload.type}`);
            }

        } catch (error) {
            this.logger.error('Erro ao processar webhook GOSAC:', error);
            throw error;
        }
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
            this.logger.error('Erro ao verificar conexão com GOSAC:', error);

            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Manipula mensagens recebidas
     */
    private async handleIncomingMessage(payload: GosacWebhookPayload): Promise<void> {
        // TODO: Implementar processamento de mensagens recebidas
        // Aqui você integrará com o ChatbotService para processar a mensagem
        this.logger.debug(`Mensagem recebida via webhook: ${JSON.stringify(payload.data)}`);
    }

    /**
     * Manipula atualizações de tickets
     */
    private async handleTicketUpdate(payload: GosacWebhookPayload): Promise<void> {
        // TODO: Implementar processamento de atualizações de tickets
        // Aqui você pode notificar usuários sobre mudanças em seus tickets
        this.logger.debug(`Ticket atualizado via webhook: ${JSON.stringify(payload.data)}`);
    }

    /**
     * Manipula mudanças de status
     */
    private async handleStatusChange(payload: GosacWebhookPayload): Promise<void> {
        // TODO: Implementar processamento de mudanças de status
        // Aqui você pode reagir a mudanças de status de clientes
        this.logger.debug(`Status alterado via webhook: ${JSON.stringify(payload.data)}`);
    }
}
