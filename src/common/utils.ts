/**
 * Utilitários para formatação de mensagens
 */
export class MessageFormatter {

    /**
     * Formata lista de opções numeradas
     */
    static formatOptions(options: string[]): string {
        return options
            .map((option, index) => `${index + 1}. ${option}`)
            .join('\n');
    }

    /**
     * Formata mensagem com título
     */
    static formatWithTitle(title: string, message: string): string {
        return `*${title}*\n\n${message}`;
    }

    /**
     * Adiciona emojis de status
     */
    static addStatusEmoji(message: string, status: 'success' | 'error' | 'warning' | 'info'): string {
        const emojis = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        return `${emojis[status]} ${message}`;
    }

    /**
     * Trunca texto se muito longo
     */
    static truncate(text: string, maxLength: number = 100): string {
        return text.length > maxLength ?
            `${text.substring(0, maxLength)}...` :
            text;
    }

    /**
     * Remove formatação de markdown
     */
    static stripMarkdown(text: string): string {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1')     // Italic
            .replace(/_(.*?)_/g, '$1')       // Underline
            .replace(/`(.*?)`/g, '$1')       // Code
            .replace(/~(.*?)~/g, '$1');      // Strikethrough
    }
}

/**
 * Utilitários para validação
 */
export class ValidationUtils {

    /**
     * Valida se é um número de telefone brasileiro
     */
    static isValidBrazilianPhone(phone: string): boolean {
        const cleanPhone = phone.replace(/\D/g, '');
        return /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/.test(cleanPhone);
    }

    /**
     * Valida CPF brasileiro
     */
    static isValidCPF(cpf: string): boolean {
        const cleanCPF = cpf.replace(/\D/g, '');

        if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }

        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;

        return remainder === parseInt(cleanCPF.charAt(10));
    }

    /**
     * Valida CNPJ brasileiro
     */
    static isValidCNPJ(cnpj: string): boolean {
        const cleanCNPJ = cnpj.replace(/\D/g, '');

        if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
            return false;
        }

        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
        }

        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;

        if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

        sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
        }

        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;

        return digit2 === parseInt(cleanCNPJ.charAt(13));
    }
}

/**
 * Utilitários para data e hora
 */
export class DateUtils {

    /**
     * Formata data para padrão brasileiro
     */
    static formatToBrazilian(date: Date): string {
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calcula diferença em minutos entre duas datas
     */
    static diffInMinutes(date1: Date, date2: Date): number {
        return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60);
    }

    /**
     * Verifica se a data é de hoje
     */
    static isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Formata duração em texto amigável
     */
    static formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
}

/**
 * Utilitários para strings
 */
export class StringUtils {

    /**
     * Capitaliza primeira letra
     */
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Remove acentos
     */
    static removeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Gera ID único simples
     */
    static generateId(prefix: string = ''): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}${timestamp}${random}`;
    }

    /**
     * Máscara para telefone brasileiro
     */
    static maskPhone(phone: string): string {
        const clean = phone.replace(/\D/g, '');

        if (clean.length === 11) {
            return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (clean.length === 10) {
            return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }

        return phone;
    }

    /**
     * Máscara para CPF
     */
    static maskCPF(cpf: string): string {
        const clean = cpf.replace(/\D/g, '');
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Máscara para CNPJ
     */
    static maskCNPJ(cnpj: string): string {
        const clean = cnpj.replace(/\D/g, '');
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
}
