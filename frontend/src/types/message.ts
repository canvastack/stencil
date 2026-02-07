export interface MessageAttachment {
  name: string;
  path: string;
  size: number;
  mime_type: string;
  url?: string;
}

export interface Message {
  uuid: string;
  quote_id: number;
  sender_id: number;
  sender?: {
    uuid: string;
    name: string;
    email: string;
    role?: string;
  };
  message: string;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  message: string;
  attachments?: File[];
}

export interface MessageListResponse {
  data: Message[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
