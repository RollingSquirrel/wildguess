import { Directive, input, computed } from '@angular/core';

@Directive({
  selector: 'input[wgInput], textarea[wgInput]',
  host: {
    '[class]': 'classes()',
  },
})
export class InputDirective {
  /** The variant style of the input. */
  variant = input<'default' | 'sm'>('default');

  protected classes = computed(() => {
    switch (this.variant()) {
      case 'default':
        return 'w-full py-3 px-4 bg-bg-primary border border-border rounded-[10px] text-text-primary text-[0.95rem] box-border transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-glow)] placeholder:text-text-muted';
      case 'sm':
        return 'w-full py-2 px-3 bg-bg-primary border border-border rounded-lg text-text-primary text-[0.85rem] box-border transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-glow)] placeholder:text-text-muted';
      default:
        return '';
    }
  });
}
