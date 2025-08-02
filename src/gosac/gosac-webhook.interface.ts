export interface GosacContact {
    id: number;
    name: string;
    number: string;
    email: string;
    profilePicUrl: string;
    isGroup: boolean;
    hasWhatsapp: boolean;
    hasTelegram: boolean;
    document?: string;
    cpf?: string;
    company?: string;
    cnpj?: string;
    blacklist: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GosacWhatsapp {
    id: number;
    name: string;
    session: string;
    status: string;
    phoneNumber: string;
    enabled: boolean;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export interface GosacTicket {
    id: number;
    status: 'open' | 'pending' | 'closed';
    unreadMessages: number;
    lastMessage: string;
    isGroup: boolean;
    userId?: number;
    contactId: number;
    whatsappId: number;
    queueId?: number;
    protocol: string;
    lastAction: string;
    statusBot: number;
    onMenu: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
    contact: GosacContact;
    whatsapp: GosacWhatsapp;
    user?: any;
    queue?: any;
}

export interface GosacMessage {
    mediaUrl?: string;
    mediaPath?: string;
    ack: number;
    read: boolean;
    fromMe: boolean;
    body: string;
    mediaType: 'chat' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location';
    messageId: string;
    queueId?: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    ticketId: number;
    contactId: number;
    groupContactId: number;
    fromGroup: boolean;
    connectionId: number;
    sent: boolean;
    kind: string;
    contact: GosacContact;
    ticket: GosacTicket;
}

export interface GosacWebhookPayload {
    data: GosacMessage;
    type: 'messages:created' | 'tickets:update' | 'contacts:update';
}

export interface GosacApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface GosacSendMessageRequest {
    number: string;
    body: string;
    mediaPath?: string;
    mediaUrl?: string;
}

export interface GosacTicketUpdateRequest {
    ticketId: number;
    status?: 'open' | 'pending' | 'closed';
    userId?: number;
    queueId?: number;
}
