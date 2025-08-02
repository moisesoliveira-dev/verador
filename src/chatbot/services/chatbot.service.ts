import { Injectable, Logger } from '@nestjs/common';
import { ConversationStateService } from './conversation-state.service';
import { ValidationService } from './validation.service';
import { FlowService } from './flow.service';
import {
    ChatbotResponse,
    ChatMessage,
    ConversationState
} from '../interfaces/conversation.interface';

@Injectable()
export class ChatbotService {
    private readonly logger = new Logger(ChatbotService.name);
    private readonly DEBOUNCE_TIME = 2000; // 2 segundos
    private readonly MAX_ATTEMPTS = 3;

    constructor(
        private readonly conversationState: ConversationStateService,
        private readonly validation: ValidationService,
        private readonly flow: FlowService
    ) { }

    /**
     * Processa mensagem do usuário e retorna resposta
     */
    async processMessage(userId: string, message: string): Promise<ChatbotResponse> {
        try {
            // Sanitiza entrada
            const sanitizedMessage = this.validation.sanitizeInput(message);

            // Registra mensagem recebida
            this.addIncomingMessage(userId, sanitizedMessage);

            // Verifica debounce
            if (this.conversationState.shouldDebounce(userId, this.DEBOUNCE_TIME)) {
                this.logger.debug(`Mensagem ignorada por debounce: usuário ${userId}`);
                return this.createSimpleResponse('⏱️ Por favor, aguarde um momento antes de enviar outra mensagem.');
            }

            // Obtém estado da conversa
            const state = this.conversationState.getConversationState(userId);

            // Verifica palavras-chave de controle
            const controlCheck = this.validation.isControlKeyword(sanitizedMessage);

            if (controlCheck.type === 'back') {
                return this.handleBackCommand(userId, state);
            }

            if (controlCheck.type === 'restart') {
                return this.handleRestartCommand(userId);
            }

            // Processa mensagem normal
            return this.processNormalMessage(userId, sanitizedMessage, state);

        } catch (error) {
            this.logger.error(`Erro ao processar mensagem do usuário ${userId}:`, error);
            return this.handleError(userId);
        }
    }

    /**
     * Processa mensagem normal (não é comando de controle)
     */
    private async processNormalMessage(
        userId: string,
        message: string,
        state: ConversationState
    ): Promise<ChatbotResponse> {
        const currentStep = this.flow.getStep(state.currentStep);

        if (!currentStep) {
            this.logger.error(`Passo não encontrado: ${state.currentStep} para usuário ${userId}`);
            this.conversationState.restartConversation(userId);
            return this.getWelcomeResponse(userId);
        }

        // Se é a primeira mensagem (step welcome, sem histórico) e não é uma opção válida numérica,
        // apenas mostra o menu de boas-vindas
        if (state.currentStep === 'welcome' && state.stepHistory.length === 0) {
            const isNumericOption = /^[1-9]\d*$/.test(message.trim());
            if (!isNumericOption) {
                const response = this.flow.buildStepResponse(currentStep);
                this.addOutgoingMessage(userId, response.message);
                return response;
            }
        }

        // Valida entrada se há regras de validação
        if (currentStep.validation) {
            const validation = this.validation.validateInput(message, currentStep.validation);

            if (!validation.isValid) {
                return this.handleValidationError(userId, validation.errorMessage!);
            }
        }

        // Executa ação do passo se houver
        if (currentStep.action) {
            try {
                await currentStep.action(message, state);
            } catch (error) {
                this.logger.error(`Erro ao executar ação do passo ${currentStep.id}:`, error);
                return this.handleError(userId);
            }
        }

        // Processa entrada e obtém próximo passo
        const { nextStepId, response } = this.flow.processUserInput(message, state.currentStep, state);

        // Se o próximo passo é validation_error, incrementa tentativas
        if (nextStepId === 'validation_error') {
            const attempts = this.conversationState.incrementAttempts(userId);

            if (attempts >= this.MAX_ATTEMPTS) {
                this.logger.warn(`Usuário ${userId} excedeu máximo de tentativas (${attempts})`);
                this.conversationState.restartConversation(userId);
                return this.createSimpleResponse(
                    `🚫 Muitas tentativas inválidas. Vamos recomeçar do início.\n\n${this.getWelcomeMessage()}`
                );
            }

            // Personaliza mensagem de erro baseado no número de tentativas
            const errorMessage = this.buildValidationErrorMessage(attempts);
            response.message = errorMessage;
        } else {
            // Move para o próximo passo
            this.conversationState.moveToStep(userId, nextStepId);
        }

        // Registra resposta
        this.addOutgoingMessage(userId, response.message);

        return response;
    }

    /**
     * Manipula comando de voltar
     */
    private handleBackCommand(userId: string, state: ConversationState): ChatbotResponse {
        const canGoBack = this.conversationState.goBackToPreviousStep(userId);

        if (!canGoBack) {
            return this.createSimpleResponse(
                '⚠️ Não é possível voltar mais. Você já está no início.\n\nVamos continuar daqui:'
            );
        }

        const newState = this.conversationState.getConversationState(userId);
        const currentStep = this.flow.getStep(newState.currentStep);

        if (!currentStep) {
            this.conversationState.restartConversation(userId);
            return this.getWelcomeResponse(userId);
        }

        const response = this.flow.buildStepResponse(currentStep);
        response.message = `⬅️ *Voltando...*\n\n${response.message}`;

        this.addOutgoingMessage(userId, response.message);
        return response;
    }

    /**
     * Manipula comando de reiniciar
     */
    private handleRestartCommand(userId: string): ChatbotResponse {
        this.conversationState.restartConversation(userId);
        const response = this.getWelcomeResponse(userId);
        response.message = `🔄 *Reiniciando conversa...*\n\n${response.message}`;

        this.addOutgoingMessage(userId, response.message);
        return response;
    }

    /**
     * Manipula erro de validação
     */
    private handleValidationError(userId: string, errorMessage: string): ChatbotResponse {
        const attempts = this.conversationState.incrementAttempts(userId);

        if (attempts >= this.MAX_ATTEMPTS) {
            this.conversationState.restartConversation(userId);
            return this.createSimpleResponse(
                `🚫 Muitas tentativas inválidas. Vamos recomeçar do início.\n\n${this.getWelcomeMessage()}`
            );
        }

        const fullMessage = this.buildValidationErrorMessage(attempts, errorMessage);
        this.addOutgoingMessage(userId, fullMessage);

        return this.createSimpleResponse(fullMessage);
    }

    /**
     * Manipula erros gerais
     */
    private handleError(userId: string): ChatbotResponse {
        this.conversationState.restartConversation(userId);
        const errorStep = this.flow.getStep('error');

        if (errorStep) {
            const response = this.flow.buildStepResponse(errorStep);
            this.addOutgoingMessage(userId, response.message);
            return response;
        }

        return this.getWelcomeResponse(userId);
    }

    /**
     * Obtém resposta de boas-vindas
     */
    private getWelcomeResponse(userId: string): ChatbotResponse {
        const welcomeStep = this.flow.getStep('welcome');
        if (welcomeStep) {
            const response = this.flow.buildStepResponse(welcomeStep);
            this.addOutgoingMessage(userId, response.message);
            return response;
        }

        return this.createSimpleResponse(this.getWelcomeMessage());
    }

    /**
     * Constrói mensagem de erro de validação
     */
    private buildValidationErrorMessage(attempts: number, customError?: string): string {
        let message = customError || '❌ Opção inválida.';

        if (attempts === 1) {
            message += '\n\nPor favor, digite uma das opções listadas.';
        } else if (attempts === 2) {
            message += '\n\n⚠️ Atenção: Digite apenas o *número* da opção desejada.';
        } else {
            message += '\n\n🚨 Última tentativa! Use apenas os números das opções.';
        }

        return message;
    }

    /**
     * Adiciona mensagem recebida ao histórico
     */
    private addIncomingMessage(userId: string, message: string): void {
        const chatMessage: ChatMessage = {
            userId,
            message,
            timestamp: new Date(),
            messageType: 'incoming'
        };

        this.conversationState.addMessage(userId, chatMessage);
    }

    /**
     * Adiciona mensagem enviada ao histórico
     */
    private addOutgoingMessage(userId: string, message: string): void {
        // Verifica se não é mensagem repetida
        if (this.conversationState.isRepeatedMessage(userId, message)) {
            this.logger.debug(`Mensagem repetida evitada para usuário ${userId}`);
            return;
        }

        const chatMessage: ChatMessage = {
            userId,
            message,
            timestamp: new Date(),
            messageType: 'outgoing'
        };

        this.conversationState.addMessage(userId, chatMessage);
    }

    /**
     * Cria resposta simples
     */
    private createSimpleResponse(message: string): ChatbotResponse {
        return { message };
    }

    /**
     * Obtém mensagem de boas-vindas padrão
     */
    private getWelcomeMessage(): string {
        return `🤖 *Olá! Bem-vindo(a) ao Verador Bot!*

Sou seu assistente virtual para gerenciamento de tickets e atendimento.

*Como posso ajudá-lo hoje?*

1. 🎫 Gerenciar Tickets
2. 📊 Status do Sistema  
3. ❓ Ajuda`;
    }

    /**
     * Obtém estatísticas do chatbot
     */
    getStatistics() {
        return {
            ...this.conversationState.getStats(),
            totalSteps: this.flow.getAllSteps().size,
            service: 'ChatbotService'
        };
    }
}
