import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-vote-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <button
      (click)="clicked.emit()"
      [class]="'vote-card ' + (selected() ? 'vote-card-selected' : '')"
      [attr.aria-label]="'Vote ' + value()"
      [attr.aria-pressed]="selected()"
      [disabled]="disabled()"
    >
      <span class="vote-value">{{ value() }}</span>
    </button>
  `,
  styles: `
    @reference "../../../../../styles.css";

    .vote-card {
      @apply relative flex items-center justify-center bg-bg-card
             border-2 border-border rounded-xl cursor-pointer overflow-hidden w-full;
      aspect-ratio: 3/4;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vote-card::before {
      content: '';
      @apply absolute inset-0 rounded-[10px] opacity-0 transition-opacity duration-300;
      background: linear-gradient(135deg, transparent 40%, rgba(0, 230, 118, 0.03));
    }
    .vote-card:hover:not(:disabled) {
      @apply border-primary;
      transform: translateY(-4px) scale(1.02);
      box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 0 15px var(--color-primary-glow);
    }
    .vote-card:hover:not(:disabled)::before {
      @apply opacity-100;
    }
    .vote-card-selected {
      @apply border-primary bg-primary-subtle;
      box-shadow:
        0 0 20px var(--color-primary-glow),
        inset 0 0 20px rgba(0, 230, 118, 0.05);
      transform: translateY(-6px) scale(1.05);
    }
    .vote-value {
      @apply text-2xl font-bold text-text-primary relative z-1;
    }
    .vote-card-selected .vote-value {
      @apply text-primary;
    }
    .vote-card:disabled {
      @apply opacity-40 cursor-not-allowed;
    }
  `,
})
export class VoteCardComponent {
  readonly value = input.required<string>();
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();
}
