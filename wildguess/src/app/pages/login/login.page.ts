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
import { ErrorBannerComponent } from '../../ui/error-banner/error-banner';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="auth-card w-full max-w-md" role="main">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold tracking-tight mb-2">
            <span class="text-primary">Wild</span><span class="text-text-primary">guess</span>
          </h1>
          <p class="text-text-secondary text-sm">Planning poker for agile teams</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label
              for="login-username"
              class="block text-sm font-medium text-text-secondary mb-1.5"
            >
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
            <label
              for="login-password"
              class="block text-sm font-medium text-text-secondary mb-1.5"
            >
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
            <wg-error-banner size="sm">
              {{ error() }}
            </wg-error-banner>
          }

          <button type="submit" [disabled]="loading() || form.invalid" class="btn-primary w-full">
            @if (loading()) {
              <span class="inline-block animate-spin mr-2">⟳</span>
            }
            Sign In
          </button>
        </form>

        <p class="text-center text-text-secondary text-sm mt-6">
          Don't have an account?
          <a routerLink="/register" class="text-primary hover:underline font-medium">Create one</a>
        </p>
      </div>
    </div>
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
