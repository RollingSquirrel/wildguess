import {
    Component,
    ChangeDetectionStrategy,
    signal,
    computed,
    inject,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RoomService } from '../../services/room.service';
import { FIBONACCI_VALUES, type RoomState, type RoomPhase } from '../../models/api.models';
import { DonutChartComponent } from '../../components/donut-chart';

@Component({
    selector: 'app-room',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, DonutChartComponent],
    templateUrl: './room.page.html',
    styleUrl: './room.page.css',
})
export class RoomPage implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly roomService = inject(RoomService);
    private readonly fb = inject(FormBuilder);

    readonly fibValues = FIBONACCI_VALUES;
    readonly roomState = signal<RoomState | null>(null);
    readonly selectedVote = signal<string | null>(null);
    readonly previousPhase = signal<RoomPhase | null>(null);
    readonly phaseAnimating = signal(false);
    readonly error = signal('');

    readonly topicForm = this.fb.nonNullable.group({
        topic: ['', Validators.required],
    });

    readonly isHost = computed(() => this.roomState()?.isHost ?? false);
    readonly phase = computed(() => this.roomState()?.phase ?? 'voting');
    readonly members = computed(() => this.roomState()?.members ?? []);
    readonly stats = computed(() => this.roomState()?.stats);
    readonly versus = computed(() => this.roomState()?.versus);
    readonly currentUserId = computed(() => this.auth.currentUser()?.id);
    readonly allVoted = computed(() => {
        const m = this.members();
        return m.length > 0 && m.every((member) => member.hasVoted);
    });

    private pollSub?: Subscription;
    private roomId = '';

    ngOnInit(): void {
        this.roomId = this.route.snapshot.paramMap.get('id') ?? '';
        if (!this.roomId) {
            this.router.navigate(['/dashboard']);
            return;
        }

        this.pollSub = this.roomService.pollRoomState(this.roomId).subscribe({
            next: (state) => {
                const prev = this.roomState();
                // Detect phase transitions for animation
                if (prev && prev.phase !== state.phase) {
                    this.previousPhase.set(prev.phase);
                    this.phaseAnimating.set(true);
                    setTimeout(() => this.phaseAnimating.set(false), 800);
                }
                // If new round, clear selected vote
                if (prev && prev.round !== state.round) {
                    this.selectedVote.set(null);
                }
                this.roomState.set(state);
            },
            error: () => {
                this.error.set('Failed to load room');
            },
        });
    }

    ngOnDestroy(): void {
        this.pollSub?.unsubscribe();
    }

    selectVote(value: string): void {
        // Toggle off if same value
        if (this.selectedVote() === value) {
            this.selectedVote.set(null);
            return;
        }
        this.selectedVote.set(value);
        this.roomService.vote(this.roomId, value).subscribe({
            error: () => this.error.set('Failed to submit vote'),
        });
    }

    reveal(): void {
        this.roomService.revealVotes(this.roomId).subscribe({
            error: () => this.error.set('Failed to reveal votes'),
        });
    }

    triggerVersus(): void {
        this.roomService.triggerVersus(this.roomId).subscribe({
            error: () => this.error.set('Failed to trigger versus'),
        });
    }

    nextRound(): void {
        this.roomService.nextRound(this.roomId).subscribe({
            error: () => this.error.set('Failed to start next round'),
        });
    }

    setTopic(): void {
        if (this.topicForm.invalid) return;
        const { topic } = this.topicForm.getRawValue();
        this.roomService.setTopic(this.roomId, topic).subscribe({
            next: () => this.topicForm.reset(),
            error: () => this.error.set('Failed to set topic'),
        });
    }

    leaveRoom(): void {
        this.roomService.leaveRoom(this.roomId).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.error.set('Failed to leave room'),
        });
    }

    kickMember(userId: string): void {
        this.roomService.kickMember(this.roomId, userId).subscribe({
            error: () => this.error.set('Failed to kick member'),
        });
    }

    copyRoomCode(): void {
        navigator.clipboard.writeText(this.roomId);
    }

    getDistributionEntries(): [string, number][] {
        const dist = this.stats()?.distribution;
        if (!dist) return [];
        return Object.entries(dist).sort(([a], [b]) => parseInt(a) - parseInt(b));
    }

    getMaxDistribution(): number {
        const entries = this.getDistributionEntries();
        if (entries.length === 0) return 1;
        return Math.max(...entries.map(([, v]) => v));
    }

    getBarHeight(count: number): number {
        return (count / this.getMaxDistribution()) * 100;
    }
}
