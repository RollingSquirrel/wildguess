import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ErrorBannerComponent } from '../../ui/error-banner/error-banner';
import { ButtonComponent } from '../../ui/button/button';
import { InputDirective } from '../../ui/input/input';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, ButtonComponent, InputDirective],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div
        class="bg-bg-surface border border-border rounded-2xl p-10 animate-slide-up-entry shadow-[0_0_60px_rgba(0,230,118,0.03)] w-full max-w-md"
        role="main"
      >
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold tracking-tight mb-2">
            <span class="text-primary">Wild</span><span class="text-text-primary">guess</span>
          </h1>
          <p class="text-text-secondary text-sm">Create your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="reg-username" class="block text-sm font-medium text-text-secondary mb-1.5">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              formControlName="username"
              autocomplete="username"
              wgInput
              placeholder="Choose a username (3-20 chars)"
            />
          </div>

          <div>
            <label for="reg-password" class="block text-sm font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              wgInput
              placeholder="Min 6 characters"
            />
          </div>

          @if (error()) {
            <wg-error-banner size="sm">
              {{ error() }}
            </wg-error-banner>
          }

          <button
            wgButton
            variant="primary"
            type="submit"
            [disabled]="loading() || form.invalid"
            class="w-full"
          >
            @if (loading()) {
              <span class="inline-block animate-spin mr-2">⟳</span>
            }
            Create Account
          </button>
        </form>

        <p class="text-center text-text-secondary text-sm mt-6">
          Already have an account?
          <a routerLink="/login" class="text-primary hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly error = signal('');

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    try {
      const { username, password } = this.form.getRawValue();
      await this.auth.register(username, password);
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const message =
        (err as { error?: { error?: string } })?.error?.error ?? 'Registration failed';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
