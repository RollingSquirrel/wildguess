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
import type { RoomSummary, DiscoverRoom } from '../../models/api.models';
import { Subscription, interval, switchMap, startWith } from 'rxjs';
import { BadgeComponent, asBadgeVariant } from '../../ui/badge/badge';
import { ErrorBannerComponent } from '../../ui/error-banner/error-banner';
import { ModalComponent } from '../../ui/modal/modal';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BadgeComponent, ErrorBannerComponent, ModalComponent],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly roomService = inject(RoomService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly asBadgeVariant = asBadgeVariant;

  readonly myRooms = signal<RoomSummary[]>([]);
  readonly allRooms = signal<DiscoverRoom[]>([]);
  readonly activeTab = signal<'browse' | 'mine'>('browse');
  readonly showCreateForm = signal(false);
  readonly error = signal('');

  // Password join dialog
  readonly joiningRoomId = signal<string | null>(null);
  readonly joinPassword = signal('');
  readonly joinError = signal('');

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    password: [''],
  });

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.pollSub = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => this.roomService.discoverRooms()),
      )
      .subscribe({
        next: (res) => this.allRooms.set(res.rooms),
        error: () => this.error.set('Failed to load rooms'),
      });

    // Also load user's rooms
    this.roomService.listRooms().subscribe({
      next: (res) => this.myRooms.set(res.rooms),
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  createRoom(): void {
    if (this.createForm.invalid) return;
    const { name, password } = this.createForm.getRawValue();

    this.roomService.createRoom(name, password || undefined).subscribe({
      next: (res) => {
        this.showCreateForm.set(false);
        this.createForm.reset();
        this.router.navigate(['/room', res.roomId]);
      },
      error: () => this.error.set('Failed to create room'),
    });
  }

  joinRoom(room: DiscoverRoom): void {
    if (room.isMember) {
      this.router.navigate(['/room', room.id]);
      return;
    }
    if (room.hasPassword) {
      this.joiningRoomId.set(room.id);
      this.joinPassword.set('');
      this.joinError.set('');
      return;
    }
    this.doJoin(room.id);
  }

  submitPasswordJoin(): void {
    const roomId = this.joiningRoomId();
    if (!roomId) return;
    this.doJoin(roomId, this.joinPassword());
  }

  cancelPasswordJoin(): void {
    this.joiningRoomId.set(null);
    this.joinPassword.set('');
    this.joinError.set('');
  }

  private doJoin(roomId: string, password?: string): void {
    this.roomService.joinRoom(roomId, password).subscribe({
      next: () => {
        this.joiningRoomId.set(null);
        this.router.navigate(['/room', roomId]);
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Failed to join room';
        if (this.joiningRoomId()) {
          this.joinError.set(msg);
        } else {
          this.error.set(msg);
        }
      },
    });
  }

  enterRoom(roomId: string): void {
    this.router.navigate(['/room', roomId]);
  }

  logout(): void {
    this.auth.logout();
  }
}
