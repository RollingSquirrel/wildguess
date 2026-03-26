import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';

@Component({
  selector: 'wg-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()" role="alert">
      <div class="flex-1 min-w-0">
        <ng-content />
      </div>
      @if (dismissible()) {
        <button
          (click)="dismiss.emit()"
          class="shrink-0 flex items-center justify-center border-none bg-transparent hover:bg-danger/10 text-danger rounded transition-colors size-6"
          title="Dismiss error"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      }
    </div>
  `,
})
export class ErrorBannerComponent {
  /** Size of the banner. 'default' includes a bottom margin. */
  size = input<'default' | 'sm'>('default');

  /** Whether the banner shows a close button */
  dismissible = input<boolean>(true);

  /** Emitted when the close button is clicked */
  readonly dismiss = output<void>();

  protected classes = computed(() => {
    const base = 'bg-danger-subtle text-danger flex items-center gap-3';
    if (this.size() === 'sm') {
      return `${base} py-2 px-3 rounded-lg text-[0.8rem]`;
    }
    return `${base} py-3 px-4 rounded-[10px] text-[0.85rem] mb-4`;
  });
}
