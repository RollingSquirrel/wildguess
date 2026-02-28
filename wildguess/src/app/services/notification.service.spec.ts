import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show and auto close notification', () => {
    service.show({
      type: 'info',
      message: 'Test message',
      autoCloseMs: 1000,
    });

    const notifs = service.notifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].message).toBe('Test message');
    expect(notifs[0].type).toBe('info');

    vi.advanceTimersByTime(1000);

    expect(service.notifications().length).toBe(0);
  });

  it('should manually remove notification', () => {
    service.show({
      type: 'error',
      message: 'Manual remove',
    });

    const notifs = service.notifications();
    expect(notifs.length).toBe(1);
    const id = notifs[0].id;

    service.remove(id);

    expect(service.notifications().length).toBe(0);
  });
});
