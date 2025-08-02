/**
 * Interfaces para integração com o sistema GOSAC
 */

export interface GosacContact {
    id: number;
    name: string;
    number: string;
    email?: string;
    profilePicUrl?: string;
    isGroup: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GosacWhatsapp {
    id: number;
    name: string;
    status: string;
    qrcode?: string;
    connected: boolean;
    battery?: number;
    plugged?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GosacTicketFull {
    id: number;
    status: string;
    lastMessage: string;
    lastMessageAt: string;
    userId?: number;
    queueId?: number;
    whatsappId: number;
    contactId: number;
    isGroup: boolean;
    unreadMessages: number;
    contact: GosacContact;
    whatsapp: GosacWhatsapp;
    createdAt: string;
    updatedAt: string;
}

export interface GosacTicket {
    id: number;
    status: string;
    lastMessage: string;
    lastMessageAt: string;
    userId?: number;
    queueId?: number;
    whatsappId: number;
    contactId: number;
    isGroup: boolean;
    unreadMessages: number;
    createdAt: string;
    updatedAt: string;
}

export interface GosacMessageData {
    id: string;
    body: string;
    mediaPath?: string;
    mediaType?: string;
    fromMe: boolean;
    fromGroup: boolean;
    isGroup: boolean;
    number: string;
    ticketId: number;
    contactId: number;
    quotedMsgId?: string;
    ack: number;
    dataJson?: any;
    ticket?: GosacTicketFull;
    contact?: GosacContact;
    createdAt: string;
    updatedAt: string;
}

export interface GosacWebhookPayload {
    type: 'messages:created' | 'tickets:created' | 'tickets:updated';
    data: GosacMessageData;
    timestamp: string;
}

export interface ProcessedWebhookData {
    messageId: string;
    contactNumber: string;
    contactName: string;
    body: string;
    mediaPath?: string;
    mediaType?: string;
    fromMe: boolean;
    ticketId?: number;
    contactId?: number;
    fromGroup: boolean;
    isGroup: boolean;
    number: string;
    status: string;
    userId?: number;
    queueId?: number;
    lastMessageAt: string;
    timestamp: string;
    shouldProcess?: boolean;
    reason?: string;
}

export interface GosacCreateTicketRequest {
    contactNumber: string;
    message?: string;
    whatsappId?: number;
    queueId?: number;
}

export interface GosacCreateTicketResponse {
    ticket: GosacTicket;
    contact: GosacContact;
    message?: string;
}

export interface GosacMessage {
    id: string;
    body: string;
    mediaPath?: string;
    mediaType?: string;
    fromMe: boolean;
    ticketId: number;
    contactId: number;
    ack: number;
    createdAt: string;
    updatedAt: string;
}

export interface GosacApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
