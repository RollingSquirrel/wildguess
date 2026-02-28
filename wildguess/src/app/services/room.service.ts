import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  interval,
  switchMap,
  startWith,
  catchError,
  of,
  throwError,
  EMPTY,
} from 'rxjs';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { NotificationService } from './notification.service';
import type { RoomSummary, RoomState, DiscoverRoom } from '../models/api.models';

const API_BASE = 'api';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly configService = inject(ConfigService);
  private readonly notificationService = inject(NotificationService);

  private headers() {
    return { headers: this.auth.getHeaders() };
  }

  /** List rooms the user is a member of */
  listRooms(): Observable<{ rooms: RoomSummary[] }> {
    return this.http.get<{ rooms: RoomSummary[] }>(`${API_BASE}/rooms`, this.headers());
  }

  /** Discover all rooms */
  discoverRooms(): Observable<{ rooms: DiscoverRoom[] }> {
    return this.http.get<{ rooms: DiscoverRoom[] }>(`${API_BASE}/rooms/discover`, this.headers());
  }

  /** Get full room state (single request) */
  getRoomState(roomId: string): Observable<RoomState> {
    return this.http.get<RoomState>(`${API_BASE}/rooms/${roomId}`, this.headers());
  }

  /** Poll room state every X seconds based on config */
  pollRoomState(roomId: string): Observable<RoomState> {
    return this.configService.getPollingRate().pipe(
      switchMap((rate) =>
        interval(rate).pipe(
          startWith(0),
          switchMap(() =>
            this.getRoomState(roomId).pipe(
              catchError((err) => {
                if (err.status === 403 || err.status === 404) {
                  this.notificationService.show({
                    type: 'error',
                    message: 'You have been disconnected from the room (timed out or kicked).',
                    actionText: 'Go to Dashboard',
                    onAction: () => this.router.navigate(['/dashboard']),
                  });
                  // Throwing error here terminates the interval stream
                  return throwError(() => err);
                }
                return throwError(() => err);
              }),
            ),
          ),
        ),
      ),
    );
  }

  /** Create a new room (optionally password-protected) */
  createRoom(name: string, password?: string): Observable<{ roomId: string }> {
    return this.http.post<{ roomId: string }>(
      `${API_BASE}/rooms`,
      { name, ...(password ? { password } : {}) },
      this.headers(),
    );
  }

  /** Join a room by code (optionally with password) */
  joinRoom(roomId: string, password?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/join`,
      password ? { password } : {},
      this.headers(),
    );
  }

  /** Leave a room */
  leaveRoom(roomId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/leave`,
      {},
      this.headers(),
    );
  }

  /** Set topic (host only) */
  setTopic(roomId: string, topic: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/topic`,
      { topic },
      this.headers(),
    );
  }

  /** Submit a vote */
  vote(roomId: string, value: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/vote`,
      { value },
      this.headers(),
    );
  }

  /** Reveal votes (host only) */
  revealVotes(roomId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/reveal`,
      {},
      this.headers(),
    );
  }

  /** Trigger versus mode (host only) */
  triggerVersus(roomId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/versus`,
      {},
      this.headers(),
    );
  }

  /** Start next round (host only) */
  nextRound(roomId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/next-round`,
      {},
      this.headers(),
    );
  }

  /** Kick a member (host only) */
  kickMember(roomId: string, targetUserId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${API_BASE}/rooms/${roomId}/kick`,
      { targetUserId },
      this.headers(),
    );
  }
}
