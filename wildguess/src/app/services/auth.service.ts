import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import type { AuthResponse, MeResponse, User } from '../models/api.models';
import { firstValueFrom } from 'rxjs';

const API_BASE = '/api';
const TOKEN_KEY = 'wildguess_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    readonly currentUser = signal<User | null>(null);
    readonly isLoggedIn = computed(() => this.currentUser() !== null);
    readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

    getHeaders(): HttpHeaders {
        const t = this.token();
        return t ? new HttpHeaders({ Authorization: `Bearer ${t}` }) : new HttpHeaders();
    }

    async register(username: string, password: string): Promise<void> {
        const res = await firstValueFrom(
            this.http.post<AuthResponse>(`${API_BASE}/auth/register`, { username, password }),
        );
        this.setSession(res.token, res.user);
    }

    async login(username: string, password: string): Promise<void> {
        const res = await firstValueFrom(
            this.http.post<AuthResponse>(`${API_BASE}/auth/login`, { username, password }),
        );
        this.setSession(res.token, res.user);
    }

    async logout(): Promise<void> {
        try {
            await firstValueFrom(
                this.http.post(`${API_BASE}/auth/logout`, {}, { headers: this.getHeaders() }),
            );
        } catch {
            // Ignore logout errors
        }
        this.clearSession();
        this.router.navigate(['/login']);
    }

    async checkSession(): Promise<boolean> {
        const t = this.token();
        if (!t) return false;

        try {
            const res = await firstValueFrom(
                this.http.get<MeResponse>(`${API_BASE}/auth/me`, { headers: this.getHeaders() }),
            );
            this.currentUser.set(res.user);
            return true;
        } catch {
            this.clearSession();
            return false;
        }
    }

    private setSession(token: string, user: User): void {
        localStorage.setItem(TOKEN_KEY, token);
        this.token.set(token);
        this.currentUser.set(user);
    }

    private clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        this.token.set(null);
        this.currentUser.set(null);
    }
}
