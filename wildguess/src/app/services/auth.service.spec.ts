import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: any;
  let routerMock: any;

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    // Mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should manage session correctly', async () => {
    const mockUser = { id: '1', username: 'testuser' };
    const mockResponse = { token: 'test-token', user: mockUser };
    httpMock.post.mockReturnValue(of(mockResponse));

    await service.login('testuser', 'password');

    expect(localStorage.setItem).toHaveBeenCalledWith('wildguess_token', 'test-token');
    expect(service.token()).toBe('test-token');
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should clear session on logout', async () => {
    // Initial state
    service['setSession']('token', { id: '1', username: 'u' });
    httpMock.post.mockReturnValue(of({ success: true }));

    await service.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('wildguess_token');
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should check session and update current user', async () => {
    const mockUser = { id: '1', username: 'testuser' };
    service.token.set('existing-token');
    httpMock.get.mockReturnValue(of({ user: mockUser }));

    const isValid = await service.checkSession();

    expect(isValid).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
    expect(httpMock.get).toHaveBeenCalledWith('api/auth/me', expect.any(Object));
  });

  it('should handle failed session check', async () => {
    service.token.set('bad-token');
    httpMock.get.mockReturnValue(throwError(() => ({ status: 401 })));

    const isValid = await service.checkSession();

    expect(isValid).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });
});
