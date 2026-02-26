import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import type { RoomSummary } from '../../models/api.models';
import { Subscription, interval, switchMap, startWith } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen">
      <!-- Header -->
      <header class="header">
        <div class="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <h1 class="text-xl font-bold">
            <span class="text-[var(--color-primary)]">Wild</span>guess
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-[var(--color-text-secondary)] text-sm">{{ auth.currentUser()?.username }}</span>
            <button (click)="logout()" class="btn-ghost text-sm" aria-label="Log out">Logout</button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="max-w-5xl mx-auto px-4 py-8">
        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          <button (click)="showCreateForm.set(!showCreateForm())" class="btn-primary">
            + Create Room
          </button>
          <button (click)="showJoinForm.set(!showJoinForm())" class="btn-outline">
            Join Room
          </button>
        </div>

        <!-- Create Room Form -->
        @if (showCreateForm()) {
          <div class="card mb-6 animate-slide-up">
            <h2 class="text-lg font-semibold mb-4">Create a New Room</h2>
            <form [formGroup]="createForm" (ngSubmit)="createRoom()" class="flex gap-3">
              <input
                id="create-room-name"
                type="text"
                formControlName="name"
                class="input-field flex-1"
                placeholder="Room name (e.g. Sprint 42)"
                aria-label="Room name"
              />
              <button type="submit" [disabled]="createForm.invalid" class="btn-primary">Create</button>
            </form>
          </div>
        }

        <!-- Join Room Form -->
        @if (showJoinForm()) {
          <div class="card mb-6 animate-slide-up">
            <h2 class="text-lg font-semibold mb-4">Join by Room Code</h2>
            <form [formGroup]="joinForm" (ngSubmit)="joinRoom()" class="flex gap-3">
              <input
                id="join-room-code"
                type="text"
                formControlName="code"
                class="input-field flex-1"
                placeholder="Enter 6-character room code"
                aria-label="Room code"
              />
              <button type="submit" [disabled]="joinForm.invalid" class="btn-primary">Join</button>
            </form>
          </div>
        }

        @if (error()) {
          <div class="text-[var(--color-danger)] text-sm bg-[rgba(255,77,106,0.1)] rounded-lg px-4 py-3 mb-4" role="alert">
            {{ error() }}
          </div>
        }

        <!-- Rooms List -->
        <h2 class="text-lg font-semibold text-[var(--color-text-secondary)] mb-4">Your Rooms</h2>

        @if (rooms().length === 0) {
          <div class="card text-center py-12">
            <p class="text-[var(--color-text-muted)] text-lg mb-2">No rooms yet</p>
            <p class="text-[var(--color-text-muted)] text-sm">Create a new room or join one to get started</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (room of rooms(); track room.id) {
              <button (click)="enterRoom(room.id)" class="room-card text-left" [attr.aria-label]="'Enter room ' + room.name">
                <div class="flex items-start justify-between mb-3">
                  <h3 class="font-semibold text-[var(--color-text-primary)] truncate">{{ room.name }}</h3>
                  @if (room.isHost) {
                    <span class="badge-host">Host</span>
                  }
                </div>
                <div class="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span class="flex items-center gap-1">
                    <span aria-hidden="true">👥</span> {{ room.memberCount }}
                  </span>
                  <span [class]="'badge-phase badge-' + room.phase">{{ room.phase }}</span>
                </div>
                <div class="mt-3 text-xs text-[var(--color-text-muted)] font-mono">{{ room.id }}</div>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .header {
      background: var(--color-bg-secondary);
      border-bottom: 1px solid var(--color-border);
    }

    .card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .room-card {
      display: block;
      width: 100%;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s;
      cursor: pointer;
      animation: slideUp 0.4s ease-out both;
    }

    .room-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 20px var(--color-primary-glow);
      transform: translateY(-2px);
    }

    .badge-host {
      font-size: 0.7rem;
      font-weight: 600;
      background: var(--color-primary-subtle);
      color: var(--color-primary);
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-phase {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .badge-voting {
      background: rgba(64, 196, 255, 0.1);
      color: var(--color-info);
    }

    .badge-revealed {
      background: rgba(0, 230, 118, 0.1);
      color: var(--color-primary);
    }

    .badge-versus {
      background: rgba(255, 170, 0, 0.1);
      color: var(--color-warning);
    }

    .input-field {
      padding: 0.65rem 1rem;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      color: var(--color-text-primary);
      font-size: 0.9rem;
      transition: border-color 0.2s, box-shadow 0.2s;
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
      padding: 0.65rem 1.25rem;
      background: var(--color-primary);
      color: var(--color-bg-primary);
      font-weight: 600;
      border-radius: 10px;
      border: none;
      font-size: 0.9rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dim);
      box-shadow: 0 0 20px var(--color-primary-glow);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline {
      padding: 0.65rem 1.25rem;
      background: transparent;
      color: var(--color-primary);
      font-weight: 600;
      border-radius: 10px;
      border: 1px solid var(--color-primary);
      font-size: 0.9rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-outline:hover {
      background: var(--color-primary-subtle);
    }

    .btn-ghost {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      transition: all 0.15s;
    }

    .btn-ghost:hover {
      color: var(--color-danger);
      background: rgba(255, 77, 106, 0.08);
    }

    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
  `,
})
export class DashboardPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly rooms = signal<RoomSummary[]>([]);
  readonly showCreateForm = signal(false);
  readonly showJoinForm = signal(false);
  readonly error = signal('');

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly joinForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  private pollSub?: Subscription;

  ngOnInit(): void {
    // Poll rooms list every 10 seconds
    this.pollSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.roomService.listRooms()),
    ).subscribe({
      next: (res) => this.rooms.set(res.rooms),
      error: () => this.error.set('Failed to load rooms'),
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }


  createRoom(): void {
    if (this.createForm.invalid) return;
    const { name } = this.createForm.getRawValue();

    this.roomService.createRoom(name).subscribe({
      next: (res) => {
        this.showCreateForm.set(false);
        this.createForm.reset();
        this.router.navigate(['/room', res.roomId]);
      },
      error: () => this.error.set('Failed to create room'),
    });
  }

  joinRoom(): void {
    if (this.joinForm.invalid) return;
    const { code } = this.joinForm.getRawValue();

    this.roomService.joinRoom(code.toUpperCase()).subscribe({
      next: () => {
        this.showJoinForm.set(false);
        this.joinForm.reset();
        this.router.navigate(['/room', code.toUpperCase()]);
      },
      error: () => this.error.set('Room not found or failed to join'),
    });
  }

  enterRoom(roomId: string): void {
    this.router.navigate(['/room', roomId]);
  }

  logout(): void {
    this.auth.logout();
  }
}
