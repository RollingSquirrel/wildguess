import {
    Component,
    ChangeDetectionStrategy,
    signal,
    inject,
    afterNextRender,
    ElementRef,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="login-card w-full max-w-md" role="main">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold tracking-tight mb-2">
            <span class="text-[var(--color-primary)]">Wild</span><span class="text-[var(--color-text-primary)]">guess</span>
          </h1>
          <p class="text-[var(--color-text-secondary)] text-sm">Planning poker for agile teams</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="login-username" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              formControlName="username"
              autocomplete="username"
              class="input-field"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label for="login-password" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="input-field"
              placeholder="Enter your password"
            />
          </div>

          @if (error()) {
            <div class="text-[var(--color-danger)] text-sm bg-[rgba(255,77,106,0.1)] rounded-lg px-4 py-2" role="alert">
              {{ error() }}
            </div>
          }

          <button
            type="submit"
            [disabled]="loading() || form.invalid"
            class="btn-primary w-full"
          >
            @if (loading()) {
              <span class="inline-block animate-spin mr-2">⟳</span>
            }
            Sign In
          </button>
        </form>

        <p class="text-center text-[var(--color-text-secondary)] text-sm mt-6">
          Don't have an account?
          <a routerLink="/register" class="text-[var(--color-primary)] hover:underline font-medium">Create one</a>
        </p>
      </div>
    </div>
  `,
    styles: `
    .login-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2.5rem;
      animation: slideUp 0.6s ease-out;
      box-shadow: 0 0 60px rgba(0, 230, 118, 0.03);
    }

    .input-field {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      color: var(--color-text-primary);
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-glow);
    }

    .input-field::placeholder {
      color: var(--color-text-muted);
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: var(--color-primary);
      color: var(--color-bg-primary);
      font-weight: 600;
      border-radius: 10px;
      border: none;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dim);
      box-shadow: 0 0 20px var(--color-primary-glow);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class LoginPage {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly form = this.fb.nonNullable.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    readonly loading = signal(false);
    readonly error = signal('');

    constructor() {
        afterNextRender(() => {
            // If already logged in, redirect
            if (this.auth.isLoggedIn()) {
                this.router.navigate(['/dashboard']);
            }
        });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;

        this.loading.set(true);
        this.error.set('');

        try {
            const { username, password } = this.form.getRawValue();
            await this.auth.login(username, password);
            this.router.navigate(['/dashboard']);
        } catch (err: unknown) {
            const message = (err as { error?: { error?: string } })?.error?.error ?? 'Login failed';
            this.error.set(message);
        } finally {
            this.loading.set(false);
        }
    }
}
