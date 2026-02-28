import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomService } from './room.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

describe('RoomService', () => {
  let service: RoomService;
  let httpMock: any;
  let routerMock: any;
  let configMock: any;
  let notificationMock: any;
  let authMock: any;

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    configMock = {
      getPollingRate: vi.fn().mockReturnValue(of(5000)),
    };
    notificationMock = {
      show: vi.fn(),
    };
    authMock = {
      getHeaders: vi.fn().mockReturnValue({}),
    };

    TestBed.configureTestingModule({
      providers: [
        RoomService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: routerMock },
        { provide: ConfigService, useValue: configMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(RoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list rooms correctly', () => {
    const mockRooms = { rooms: [] };
    httpMock.get.mockReturnValue(of(mockRooms));

    service.listRooms().subscribe((res) => {
      expect(res).toEqual(mockRooms);
    });

    expect(httpMock.get).toHaveBeenCalledWith('api/rooms', expect.any(Object));
  });

  it('should call getRoomState with correct URL', () => {
    const roomId = 'test-room';
    httpMock.get.mockReturnValue(of({}));

    service.getRoomState(roomId).subscribe();

    expect(httpMock.get).toHaveBeenCalledWith(`api/rooms/${roomId}`, expect.any(Object));
  });

  it('should create room with correct data', () => {
    httpMock.post.mockReturnValue(of({ roomId: 'new-id' }));
    authMock.getHeaders.mockReturnValue({ Authorization: 'Bearer test' });

    service.createRoom('My Room', 'secret').subscribe();

    expect(httpMock.post).toHaveBeenCalledWith(
      'api/rooms',
      { name: 'My Room', password: 'secret' },
      { headers: { Authorization: 'Bearer test' } },
    );
  });

  it('should handle joinRoom with password', () => {
    httpMock.post.mockReturnValue(of({ success: true }));
    service.joinRoom('r1', 'p1').subscribe();
    expect(httpMock.post).toHaveBeenCalledWith(
      'api/rooms/r1/join',
      { password: 'p1' },
      expect.any(Object),
    );
  });
});
