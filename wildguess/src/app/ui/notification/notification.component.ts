import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { ButtonDirective } from '../button/button';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, ButtonDirective],
  templateUrl: './notification.component.html',
})
export class NotificationComponent {
  readonly notificationService = inject(NotificationService);
  readonly notifications = this.notificationService.notifications;

  getIconColor(type: string): string {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  }

  getBorderColor(type: string): string {
    switch (type) {
      case 'error':
        return 'border-red-500/50';
      case 'warning':
        return 'border-amber-500/50';
      case 'info':
      default:
        return 'border-blue-500/50';
    }
  }

  handleAction(notification: any) {
    if (notification.onAction) {
      notification.onAction();
    }
    this.notificationService.remove(notification.id);
  }

  dismiss(id: string) {
    this.notificationService.remove(id);
  }
}
