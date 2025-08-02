export interface GosacMessage {
    to: string;
    message: string;
    type?: 'text' | 'media';
    mediaUrl?: string;
}

export interface GosacTicket {
    id: string;
    userId: string;
    status: 'open' | 'in_progress' | 'closed' | 'waiting';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    subject: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    assignedTo?: string;
}

export interface GosacApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface GosacWebhookPayload {
    type: 'message' | 'ticket_update' | 'status_change';
    userId: string;
    data: any;
    timestamp: Date;
}
