import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'wg-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()" role="alert">
      <ng-content />
    </div>
  `,
})
export class ErrorBannerComponent {
  /** Size of the banner. 'default' includes a bottom margin. */
  size = input<'default' | 'sm'>('default');

  protected classes = computed(() => {
    const base = 'bg-danger-subtle text-danger';
    if (this.size() === 'sm') {
      return `${base} py-2 px-3 rounded-lg text-[0.8rem]`;
    }
    return `${base} py-3 px-4 rounded-[10px] text-[0.85rem] mb-4`;
  });
}
