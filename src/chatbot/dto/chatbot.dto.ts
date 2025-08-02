import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class IncomingMessageDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsOptional()
    @IsDateString()
    timestamp?: string;
}

export class ChatbotResponseDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsOptional()
    options?: string[];

    @IsOptional()
    shouldEnd?: boolean;

    @IsOptional()
    data?: Record<string, any>;
}

export class ConversationStatsDto {
    userId: string;
    currentStep: string;
    stepHistory: string[];
    lastMessageTime: Date;
    isActive: boolean;
    attempts: number;
}
