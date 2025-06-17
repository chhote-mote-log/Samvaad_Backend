export interface NotificationEvent {
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, any>;
}
