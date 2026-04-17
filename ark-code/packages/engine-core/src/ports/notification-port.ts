export type EngineNotification = {
  level: 'info' | 'warning' | 'error'
  message: string
}

export interface NotificationPort {
  enqueue(notification: EngineNotification): void
}
