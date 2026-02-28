import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type BadgeVariant =
  | 'host'
  | 'member'
  | 'phase-voting'
  | 'phase-revealed'
  | 'phase-versus'
  | 'lock';

/** Use in templates when building a variant string dynamically, e.g. `asBadgeVariant('phase-' + room.phase)` */
export function asBadgeVariant(v: string): BadgeVariant {
  return v as BadgeVariant;
}

// Maps each variant to its Tailwind classes
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  host: 'text-[0.65rem] font-semibold bg-primary-subtle text-primary py-0.5 px-2 rounded-md uppercase tracking-wide',
  member: 'text-[0.65rem] font-semibold bg-info-subtle text-info py-0.5 px-2 rounded-md uppercase',
  'phase-voting':
    'text-[0.7rem] font-semibold bg-info-subtle text-info py-[3px] px-2.5 rounded-md uppercase tracking-wide capitalize',
  'phase-revealed':
    'text-[0.7rem] font-semibold bg-primary-subtle text-primary py-[3px] px-2.5 rounded-md uppercase tracking-wide capitalize',
  'phase-versus':
    'text-[0.7rem] font-semibold bg-warning-subtle text-warning py-[3px] px-2.5 rounded-md uppercase tracking-wide capitalize',
  lock: 'text-sm leading-none',
};

@Component({
  selector: 'wg-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="variantClass()"><ng-content /></span>`,
  host: { class: 'contents' },
})
export class BadgeComponent {
  readonly variant = input.required<BadgeVariant>();

  protected variantClass = () => VARIANT_CLASSES[this.variant()];
}
