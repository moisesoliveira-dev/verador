import { Injectable } from '@nestjs/common';
import { ValidationRule } from '../interfaces/conversation.interface';

@Injectable()
export class ValidationService {

    /**
     * Valida entrada do usuário baseado nas regras
     */
    validateInput(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        if (!input || input.trim() === '') {
            if (rule.required !== false) {
                return {
                    isValid: false,
                    errorMessage: rule.errorMessage || 'Por favor, digite uma resposta válida.'
                };
            }
            return { isValid: true };
        }

        const trimmedInput = input.trim();

        // Validação de comprimento mínimo
        if (rule.minLength && trimmedInput.length < rule.minLength) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || `A resposta deve ter pelo menos ${rule.minLength} caracteres.`
            };
        }

        // Validação de comprimento máximo
        if (rule.maxLength && trimmedInput.length > rule.maxLength) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || `A resposta deve ter no máximo ${rule.maxLength} caracteres.`
            };
        }

        // Validação por tipo
        switch (rule.type) {
            case 'number':
                return this.validateNumber(trimmedInput, rule);

            case 'email':
                return this.validateEmail(trimmedInput, rule);

            case 'phone':
                return this.validatePhone(trimmedInput, rule);

            case 'option':
                return this.validateOption(trimmedInput, rule);

            case 'custom':
                return this.validateCustom(trimmedInput, rule);

            case 'text':
            default:
                return this.validateText(trimmedInput, rule);
        }
    }

    /**
     * Valida se é um número válido
     */
    private validateNumber(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        const num = Number(input);
        if (isNaN(num)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Por favor, digite apenas números.'
            };
        }

        if (rule.pattern && !rule.pattern.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Formato de número inválido.'
            };
        }

        return { isValid: true };
    }

    /**
     * Valida email
     */
    private validateEmail(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Por favor, digite um email válido.'
            };
        }

        if (rule.pattern && !rule.pattern.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Formato de email inválido.'
            };
        }

        return { isValid: true };
    }

    /**
     * Valida telefone
     */
    private validatePhone(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        // Remove caracteres não numéricos
        const cleanPhone = input.replace(/\D/g, '');

        // Validação básica de telefone brasileiro
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Por favor, digite um telefone válido (10 ou 11 dígitos).'
            };
        }

        if (rule.pattern && !rule.pattern.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Formato de telefone inválido.'
            };
        }

        return { isValid: true };
    }

    /**
     * Valida opção (número ou texto de uma lista)
     */
    private validateOption(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        // Se é um número, verifica se está na faixa válida
        const num = Number(input);
        if (!isNaN(num)) {
            return { isValid: true }; // A validação específica da opção será feita no flow
        }

        if (rule.pattern && !rule.pattern.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Opção inválida. Por favor, escolha uma das opções disponíveis.'
            };
        }

        return { isValid: true };
    }

    /**
     * Valida texto simples
     */
    private validateText(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        if (rule.pattern && !rule.pattern.test(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Formato de texto inválido.'
            };
        }

        return { isValid: true };
    }

    /**
     * Valida usando validador customizado
     */
    private validateCustom(input: string, rule: ValidationRule): { isValid: boolean; errorMessage?: string } {
        if (rule.customValidator && !rule.customValidator(input)) {
            return {
                isValid: false,
                errorMessage: rule.errorMessage || 'Entrada inválida.'
            };
        }

        return { isValid: true };
    }

    /**
     * Normaliza entrada do usuário
     */
    normalizeInput(input: string): string {
        return input.trim().toLowerCase();
    }

    /**
     * Verifica se a entrada corresponde a uma palavra-chave de controle
     */
    isControlKeyword(input: string): { type: 'back' | 'restart' | null; keyword: string } {
        const normalized = this.normalizeInput(input);

        // Palavras para voltar
        const backKeywords = ['voltar', 'anterior', '0', 'back'];
        if (backKeywords.includes(normalized)) {
            return { type: 'back', keyword: normalized };
        }

        // Palavras para reiniciar
        const restartKeywords = ['inicio', 'iniciar', 'recomecar', 'restart', 'start', '#'];
        if (restartKeywords.includes(normalized)) {
            return { type: 'restart', keyword: normalized };
        }

        return { type: null, keyword: normalized };
    }

    /**
     * Sanitiza entrada para evitar injeções ou caracteres perigosos
     */
    sanitizeInput(input: string): string {
        return input
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
            .replace(/[<>]/g, '') // Remove < e >
            .substring(0, 1000); // Limita tamanho
    }
}
