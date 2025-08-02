import { Injectable, Logger } from '@nestjs/common';
import {
    FlowStep,
    ConversationState,
    ChatbotResponse,
    ValidationRule
} from '../interfaces/conversation.interface';

@Injectable()
export class FlowService {
    private readonly logger = new Logger(FlowService.name);
    private readonly flows = new Map<string, FlowStep>();

    constructor() {
        this.initializeFlows();
    }

    /**
     * Obtém um passo do fluxo
     */
    getStep(stepId: string): FlowStep | undefined {
        return this.flows.get(stepId);
    }

    /**
     * Obtém todos os passos disponíveis
     */
    getAllSteps(): Map<string, FlowStep> {
        return new Map(this.flows);
    }

    /**
     * Adiciona ou atualiza um passo no fluxo
     */
    addStep(step: FlowStep): void {
        this.flows.set(step.id, step);
        this.logger.debug(`Passo adicionado/atualizado: ${step.id}`);
    }

    /**
     * Remove um passo do fluxo
     */
    removeStep(stepId: string): boolean {
        const removed = this.flows.delete(stepId);
        if (removed) {
            this.logger.debug(`Passo removido: ${stepId}`);
        }
        return removed;
    }

    /**
     * Processa entrada do usuário e retorna próximo passo
     */
    processUserInput(
        userInput: string,
        currentStepId: string,
        state: ConversationState
    ): { nextStepId: string; response: ChatbotResponse } {
        const currentStep = this.getStep(currentStepId);

        if (!currentStep) {
            this.logger.error(`Passo não encontrado: ${currentStepId}`);
            return {
                nextStepId: 'welcome',
                response: {
                    message: 'Ops! Algo deu errado. Vamos recomeçar do início.',
                    shouldEnd: false
                }
            };
        }

        // Determina próximo passo
        let nextStepId: string;

        if (typeof currentStep.nextStep === 'function') {
            nextStepId = currentStep.nextStep(userInput, state);
        } else if (typeof currentStep.nextStep === 'string') {
            nextStepId = currentStep.nextStep;
        } else {
            // Se não há próximo passo definido, processa opções
            nextStepId = this.processStepOptions(userInput, currentStep);
        }

        const nextStep = this.getStep(nextStepId);
        if (!nextStep) {
            this.logger.error(`Próximo passo não encontrado: ${nextStepId}`);
            nextStepId = 'welcome';
        }

        return {
            nextStepId,
            response: this.buildStepResponse(nextStep || this.getStep('welcome')!)
        };
    }

    /**
     * Constrói resposta para um passo
     */
    buildStepResponse(step: FlowStep): ChatbotResponse {
        const response: ChatbotResponse = {
            message: step.message
        };

        // Adiciona opções se existirem
        if (step.options && step.options.length > 0) {
            response.options = step.options.map((option, index) =>
                `${index + 1}. ${option.text}`
            );
        }

        // Adiciona opções de controle se permitido
        const controlOptions: string[] = [];

        if (step.allowBack !== false) {
            controlOptions.push('0. ⬅️ Voltar');
        }

        if (step.allowRestart !== false) {
            controlOptions.push('#. 🔄 Recomeçar');
        }

        if (controlOptions.length > 0) {
            response.options = [...(response.options || []), ...controlOptions];
        }

        return response;
    }

    /**
     * Processa opções de um passo
     */
    private processStepOptions(userInput: string, step: FlowStep): string {
        if (!step.options || step.options.length === 0) {
            return 'error';
        }

        const input = userInput.trim();
        const inputNumber = parseInt(input);

        // Verifica se é um número válido para as opções
        if (!isNaN(inputNumber) && inputNumber >= 1 && inputNumber <= step.options.length) {
            return step.options[inputNumber - 1].nextStep;
        }

        // Verifica se o texto corresponde a alguma opção
        const normalizedInput = input.toLowerCase();
        for (const option of step.options) {
            if (option.text.toLowerCase().includes(normalizedInput) ||
                option.key.toLowerCase() === normalizedInput) {
                return option.nextStep;
            }
        }

        // Se não encontrou correspondência, retorna erro de validação
        return 'validation_error';
    }

    /**
     * Inicializa os fluxos básicos do chatbot
     */
    private initializeFlows(): void {
        // Passo de boas-vindas
        this.addStep({
            id: 'welcome',
            name: 'Boas-vindas',
            message: `🤖 *Olá! Bem-vindo(a) ao Verador Bot!*

Sou seu assistente virtual para gerenciamento de tickets e atendimento.

*Como posso ajudá-lo hoje?*`,
            options: [
                { key: 'tickets', text: '🎫 Gerenciar Tickets', nextStep: 'tickets_menu' },
                { key: 'status', text: '📊 Status do Sistema', nextStep: 'system_status' },
                { key: 'help', text: '❓ Ajuda', nextStep: 'help_menu' }
            ],
            allowBack: false,
            allowRestart: false
        });

        // Menu de tickets
        this.addStep({
            id: 'tickets_menu',
            name: 'Menu de Tickets',
            message: `🎫 *Gerenciamento de Tickets*

Escolha uma das opções abaixo:`,
            options: [
                { key: 'create', text: '➕ Criar Novo Ticket', nextStep: 'create_ticket' },
                { key: 'list', text: '📋 Listar Meus Tickets', nextStep: 'list_tickets' },
                { key: 'update', text: '✏️ Atualizar Status', nextStep: 'update_ticket' }
            ]
        });

        // Status do sistema
        this.addStep({
            id: 'system_status',
            name: 'Status do Sistema',
            message: `📊 *Status do Sistema*

✅ Sistema GOSAC: Online
✅ Base de Dados: Conectada
✅ Chatbot: Funcionando

🕐 Última verificação: ${new Date().toLocaleString('pt-BR')}

*O sistema está funcionando normalmente.*`,
            nextStep: 'welcome'
        });

        // Menu de ajuda
        this.addStep({
            id: 'help_menu',
            name: 'Menu de Ajuda',
            message: `❓ *Central de Ajuda*

*Como usar o bot:*

• Digite o número da opção desejada
• Use *0* para voltar ao passo anterior
• Use *#* para recomeçar do início
• Todas as opções são numeradas para facilitar

*Comandos disponíveis:*
- Números (1, 2, 3...) para navegar
- 0 para voltar
- # para recomeçar

*Precisa de mais ajuda?* Entre em contato com nosso suporte.`,
            nextStep: 'welcome'
        });

        // Passo de criação de ticket (placeholder)
        this.addStep({
            id: 'create_ticket',
            name: 'Criar Ticket',
            message: `➕ *Criar Novo Ticket*

Esta funcionalidade será implementada em breve.

Por enquanto, você pode usar as outras opções do menu principal.`,
            nextStep: 'tickets_menu'
        });

        // Passo de listagem de tickets (placeholder)
        this.addStep({
            id: 'list_tickets',
            name: 'Listar Tickets',
            message: `📋 *Seus Tickets*

Esta funcionalidade será implementada em breve.

Aqui você poderá visualizar todos os seus tickets ativos e histórico.`,
            nextStep: 'tickets_menu'
        });

        // Passo de atualização de ticket (placeholder)
        this.addStep({
            id: 'update_ticket',
            name: 'Atualizar Ticket',
            message: `✏️ *Atualizar Status do Ticket*

Esta funcionalidade será implementada em breve.

Aqui você poderá alterar o status dos seus tickets.`,
            nextStep: 'tickets_menu'
        });

        // Passo de erro de validação
        this.addStep({
            id: 'validation_error',
            name: 'Erro de Validação',
            message: `❌ *Opção inválida*

Por favor, escolha uma das opções listadas acima digitando o número correspondente.

*Exemplo:* Digite *1* para a primeira opção, *2* para a segunda, etc.

Ou use:
• *0* para voltar
• *#* para recomeçar`,
            nextStep: (userInput: string, state: ConversationState) => {
                // Retorna para o passo anterior se houver histórico
                if (state.stepHistory.length > 0) {
                    return state.stepHistory[state.stepHistory.length - 1];
                }
                return 'welcome';
            }
        });

        // Passo de erro genérico
        this.addStep({
            id: 'error',
            name: 'Erro',
            message: `🚫 *Ops! Algo deu errado*

Ocorreu um erro inesperado. Vamos recomeçar do início para garantir que tudo funcione corretamente.

Não se preocupe, seus dados estão seguros! 😊`,
            nextStep: 'welcome',
            allowBack: false
        });

        this.logger.debug(`${this.flows.size} passos de fluxo inicializados`);
    }
}
