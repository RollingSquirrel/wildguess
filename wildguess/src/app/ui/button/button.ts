import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'button[wgButton], a[wgButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonComponent {
  /** The variant style of the button. */
  variant = input<'primary' | 'sm' | 'ghost' | 'cancel' | 'danger-ghost'>('primary');

  protected classes = computed(() => {
    switch (this.variant()) {
      case 'primary':
        return 'py-3 px-5 bg-primary text-bg-primary font-semibold rounded-[10px] border-none text-[0.9rem] whitespace-nowrap cursor-pointer transition-all duration-200 hover:enabled:bg-primary-dim hover:enabled:shadow-[0_0_20px_var(--color-primary-glow)] disabled:opacity-50 disabled:cursor-not-allowed';
      case 'sm':
        return 'py-2 px-4 bg-primary text-bg-primary font-semibold rounded-lg border-none text-[0.85rem] whitespace-nowrap transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
      case 'ghost':
        return 'bg-transparent border-none text-text-secondary font-medium py-2 px-3 rounded-lg cursor-pointer transition-all duration-150 hover:text-danger hover:bg-danger-subtle disabled:opacity-50 disabled:cursor-not-allowed';
      case 'cancel':
        return 'w-full bg-transparent border border-border text-text-secondary py-2 rounded-lg cursor-pointer text-[0.85rem] transition-all duration-150 hover:border-text-secondary disabled:opacity-50 disabled:cursor-not-allowed';
      case 'danger-ghost':
        return 'bg-transparent border border-danger text-danger py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-all duration-150 hover:bg-danger-subtle disabled:opacity-50 disabled:cursor-not-allowed';
      default:
        return '';
    }
  });
}
