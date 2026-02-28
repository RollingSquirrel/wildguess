import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'wg-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-100 animate-fade-in"
      (click)="closed.emit()"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-bg-surface border border-border rounded-2xl p-8 max-w-[400px] w-[90%] animate-slide-up"
        (click)="$event.stopPropagation()"
      >
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  closed = output<void>();
}
