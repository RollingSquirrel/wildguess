import { Injectable, signal } from '@angular/core';

export type NotificationType = 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  actionText?: string;
  onAction?: () => void;
  autoCloseMs?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  show(notification: Omit<AppNotification, 'id'>) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    const newNotification: AppNotification = { ...notification, id };

    this._notifications.update((current) => [...current, newNotification]);

    if (newNotification.autoCloseMs) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.autoCloseMs);
    }
  }

  remove(id: string) {
    this._notifications.update((current) => current.filter((n) => n.id !== id));
  }
}
