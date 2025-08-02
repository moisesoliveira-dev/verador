import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../src/chatbot/services/chatbot.service';
import { ConversationStateService } from '../src/chatbot/services/conversation-state.service';
import { ValidationService } from '../src/chatbot/services/validation.service';
import { FlowService } from '../src/chatbot/services/flow.service';

describe('ChatbotService', () => {
    let service: ChatbotService;
    let conversationState: ConversationStateService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatbotService,
                ConversationStateService,
                ValidationService,
                FlowService
            ],
        }).compile();

        service = module.get<ChatbotService>(ChatbotService);
        conversationState = module.get<ConversationStateService>(ConversationStateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should show welcome message for new user', async () => {
        const response = await service.processMessage('test-user', 'Olá');

        expect(response.message).toContain('Bem-vindo(a) ao Verador Bot');
        expect(response.options).toBeDefined();
        expect(response.options?.length).toBeGreaterThan(0);
    });

    it('should navigate to tickets menu when option 1 is selected', async () => {
        // Primeiro, inicializa conversa
        await service.processMessage('test-user-2', 'Oi');

        // Aguarda um pouco para evitar debounce
        await new Promise(resolve => setTimeout(resolve, 2100));

        // Então navega
        const response = await service.processMessage('test-user-2', '1');

        expect(response.message).toContain('Gerenciamento de Tickets');
        expect(response.options).toBeDefined();
    });

    it('should handle back command', async () => {
        // Inicializa e navega para submenu
        await service.processMessage('test-user-3', 'Oi');
        await new Promise(resolve => setTimeout(resolve, 2100));
        await service.processMessage('test-user-3', '1');
        await new Promise(resolve => setTimeout(resolve, 2100));

        // Volta
        const response = await service.processMessage('test-user-3', '0');

        expect(response.message).toContain('Voltando');
        expect(response.message).toContain('Bem-vindo(a) ao Verador Bot');
    });

    it('should handle restart command', async () => {
        // Inicializa conversa
        await service.processMessage('test-user-4', 'Oi');
        await new Promise(resolve => setTimeout(resolve, 2100));

        // Reinicia
        const response = await service.processMessage('test-user-4', '#');

        expect(response.message).toContain('Reiniciando conversa');
        expect(response.message).toContain('Bem-vindo(a) ao Verador Bot');
    });

    it('should handle debounce correctly', async () => {
        const response1 = await service.processMessage('test-user-5', 'Primeira mensagem');
        const response2 = await service.processMessage('test-user-5', 'Segunda mensagem rápida');

        expect(response2.message).toContain('aguarde um momento');
    });

    afterEach(() => {
        // Limpa estados de teste
        conversationState['conversations'].clear();
        conversationState['messageHistory'].clear();
    });
});
