import { Injectable, Logger } from '@nestjs/common';
import { ConversationState, ChatMessage } from '../interfaces/conversation.interface';

@Injectable()
export class ConversationStateService {
    private readonly logger = new Logger(ConversationStateService.name);
    private readonly conversations = new Map<string, ConversationState>();
    private readonly messageHistory = new Map<string, ChatMessage[]>();
    private readonly CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

    constructor() {
        // Limpeza automática de conversas expiradas a cada 5 minutos
        setInterval(() => {
            this.cleanupExpiredConversations();
        }, 5 * 60 * 1000);
    }

    /**
     * Obtém o estado da conversa para um usuário
     */
    getConversationState(userId: string): ConversationState {
        if (!this.conversations.has(userId)) {
            this.initializeConversation(userId);
        }

        const state = this.conversations.get(userId)!;
        state.lastMessageTime = new Date();
        return state;
    }

    /**
     * Atualiza o estado da conversa
     */
    updateConversationState(userId: string, updates: Partial<ConversationState>): void {
        const state = this.getConversationState(userId);
        Object.assign(state, updates);
        state.lastMessageTime = new Date();
        this.conversations.set(userId, state);

        this.logger.debug(`Estado atualizado para usuário ${userId}: ${JSON.stringify(updates)}`);
    }

    /**
     * Move para o próximo passo e atualiza o histórico
     */
    moveToStep(userId: string, stepId: string): void {
        const state = this.getConversationState(userId);

        if (state.currentStep !== stepId) {
            state.stepHistory.push(state.currentStep);
            state.currentStep = stepId;
            state.attempts = 0;
            state.waitingFor = undefined;
        }

        this.updateConversationState(userId, state);
    }

    /**
     * Volta para o passo anterior
     */
    goBackToPreviousStep(userId: string): boolean {
        const state = this.getConversationState(userId);

        if (state.stepHistory.length > 0) {
            const previousStep = state.stepHistory.pop()!;
            state.currentStep = previousStep;
            state.attempts = 0;
            state.waitingFor = undefined;

            this.updateConversationState(userId, state);
            this.logger.debug(`Usuário ${userId} voltou para o passo: ${previousStep}`);
            return true;
        }

        return false;
    }

    /**
     * Reinicia a conversa do início
     */
    restartConversation(userId: string): void {
        this.initializeConversation(userId);
        this.logger.debug(`Conversa reiniciada para usuário ${userId}`);
    }

    /**
     * Incrementa tentativas de entrada inválida
     */
    incrementAttempts(userId: string): number {
        const state = this.getConversationState(userId);
        state.attempts += 1;
        this.updateConversationState(userId, state);
        return state.attempts;
    }

    /**
     * Adiciona dados à conversa
     */
    addData(userId: string, key: string, value: any): void {
        const state = this.getConversationState(userId);
        state.data[key] = value;
        this.updateConversationState(userId, state);
    }

    /**
     * Obtém dados da conversa
     */
    getData(userId: string, key?: string): any {
        const state = this.getConversationState(userId);
        return key ? state.data[key] : state.data;
    }

    /**
     * Adiciona mensagem ao histórico
     */
    addMessage(userId: string, message: ChatMessage): void {
        if (!this.messageHistory.has(userId)) {
            this.messageHistory.set(userId, []);
        }

        const history = this.messageHistory.get(userId)!;
        history.push(message);

        // Mantém apenas as últimas 50 mensagens
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
    }

    /**
     * Obtém histórico de mensagens
     */
    getMessageHistory(userId: string): ChatMessage[] {
        return this.messageHistory.get(userId) || [];
    }

    /**
     * Verifica se o usuário enviou a última mensagem recentemente (debounce)
     */
    shouldDebounce(userId: string, debounceMs: number = 2000): boolean {
        const history = this.getMessageHistory(userId);
        const incomingMessages = history.filter(msg => msg.messageType === 'incoming');

        // Se não há mensagens ou só há uma mensagem, não faz debounce
        if (incomingMessages.length <= 1) return false;

        const lastIncoming = incomingMessages[incomingMessages.length - 1];
        const secondLastIncoming = incomingMessages[incomingMessages.length - 2];

        if (!lastIncoming || !secondLastIncoming) return false;

        const timeDiff = lastIncoming.timestamp.getTime() - secondLastIncoming.timestamp.getTime();
        return timeDiff < debounceMs;
    }

    /**
     * Verifica se a última mensagem foi repetida
     */
    isRepeatedMessage(userId: string, message: string): boolean {
        const history = this.getMessageHistory(userId);
        const outgoingMessages = history
            .filter(msg => msg.messageType === 'outgoing')
            .slice(-2); // Últimas 2 mensagens enviadas

        return outgoingMessages.some(msg =>
            msg.message.toLowerCase().trim() === message.toLowerCase().trim()
        );
    }

    /**
     * Limpa conversas expiradas
     */
    private cleanupExpiredConversations(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [userId, state] of this.conversations.entries()) {
            if (now - state.lastMessageTime.getTime() > this.CONVERSATION_TIMEOUT) {
                this.conversations.delete(userId);
                this.messageHistory.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.debug(`Limpeza automática: ${cleanedCount} conversas expiradas removidas`);
        }
    }

    /**
     * Inicializa uma nova conversa
     */
    private initializeConversation(userId: string): void {
        const state: ConversationState = {
            userId,
            currentStep: 'welcome',
            stepHistory: [],
            lastMessageTime: new Date(),
            isActive: true,
            data: {},
            attempts: 0
        };

        this.conversations.set(userId, state);
        this.messageHistory.set(userId, []);
    }

    /**
     * Obtém estatísticas das conversas ativas
     */
    getStats() {
        return {
            activeConversations: this.conversations.size,
            totalUsers: this.messageHistory.size,
            timestamp: new Date()
        };
    }
}
