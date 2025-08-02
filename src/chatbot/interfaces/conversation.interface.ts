export interface ConversationState {
    userId: string;
    currentStep: string;
    stepHistory: string[];
    lastMessageTime: Date;
    isActive: boolean;
    data: Record<string, any>;
    waitingFor?: string;
    attempts: number;
}

export interface ChatMessage {
    userId: string;
    message: string;
    timestamp: Date;
    messageType: 'incoming' | 'outgoing';
}

export interface FlowStep {
    id: string;
    name: string;
    message: string;
    options?: FlowOption[];
    validation?: ValidationRule;
    nextStep?: string | ((userInput: string, state: ConversationState) => string);
    action?: (userInput: string, state: ConversationState) => Promise<void>;
    allowBack?: boolean;
    allowRestart?: boolean;
}

export interface FlowOption {
    key: string;
    text: string;
    nextStep: string;
}

export interface ValidationRule {
    type: 'number' | 'text' | 'email' | 'phone' | 'option' | 'custom';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => boolean;
    errorMessage?: string;
}

export interface ChatbotResponse {
    message: string;
    options?: string[];
    shouldEnd?: boolean;
    data?: Record<string, any>;
}
