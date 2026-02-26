import {
    Component,
    ChangeDetectionStrategy,
    input,
    effect,
    ElementRef,
    viewChild,
    afterNextRender,
} from '@angular/core';
import { animate } from 'animejs';

interface Segment {
    value: string;
    count: number;
    color: string;
    startAngle: number;
    endAngle: number;
    percentage: number;
}

const PALETTE = [
    '#00e676', '#40c4ff', '#ffaa00', '#ff4d6a',
    '#aa66ff', '#00e5ff', '#ff6b35', '#76ff03',
];

@Component({
    selector: 'app-donut-chart',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="donut-container">
            <svg #svgEl [attr.viewBox]="'0 0 ' + size + ' ' + size" class="donut-svg">
                <!-- Background ring -->
                <circle
                    [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
                    fill="none" stroke="var(--color-border)" [attr.stroke-width]="strokeWidth"
                    opacity="0.3"
                />
                <!-- Segments rendered programmatically -->
            </svg>
            <div class="donut-center">
                <div class="donut-total">{{ totalVotes() }}</div>
                <div class="donut-label">votes</div>
            </div>
            <div class="donut-legend">
                @for (seg of segments; track seg.value) {
                    <div class="legend-item">
                        <span class="legend-dot" [style.background]="seg.color"></span>
                        <span class="legend-value">{{ seg.value }}</span>
                        <span class="legend-count">×{{ seg.count }}</span>
                    </div>
                }
            </div>
        </div>
    `,
    styles: `
        .donut-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }

        .donut-svg {
            width: 160px;
            height: 160px;
        }

        .donut-center {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 160px;
            height: 160px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }

        .donut-total {
            font-size: 2rem;
            font-weight: 800;
            color: var(--color-primary);
            line-height: 1;
        }

        .donut-label {
            font-size: 0.7rem;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
        }

        .donut-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem 1rem;
            justify-content: center;
            margin-top: 0.75rem;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.8rem;
        }

        .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .legend-value {
            color: var(--color-text-primary);
            font-weight: 600;
        }

        .legend-count {
            color: var(--color-text-muted);
            font-size: 0.75rem;
        }
    `,
})
export class DonutChartComponent {
    readonly distribution = input.required<Record<string, number>>();
    readonly totalVotes = input.required<number>();

    readonly svgRef = viewChild.required<ElementRef<SVGElement>>('svgEl');

    readonly size = 160;
    readonly center = 80;
    readonly radius = 60;
    readonly strokeWidth = 18;

    segments: Segment[] = [];

    constructor() {
        afterNextRender(() => {
            // run initial render after view is ready
            this.renderChart();
        });

        effect(() => {
            // Re-render when distribution changes
            const dist = this.distribution();
            if (dist && Object.keys(dist).length > 0) {
                this.renderChart();
            }
        });
    }

    private renderChart(): void {
        const dist = this.distribution();
        const total = Object.values(dist).reduce((a, b) => a + b, 0);
        if (total === 0) return;

        const svg = this.svgRef().nativeElement;

        // Remove old segments
        svg.querySelectorAll('.donut-segment').forEach((el) => el.remove());

        const entries = Object.entries(dist).sort(([a], [b]) => parseInt(a) - parseInt(b));

        let currentAngle = -90; // start at top
        this.segments = [];

        entries.forEach(([value, count], i) => {
            const percentage = count / total;
            const angle = percentage * 360;
            const color = PALETTE[i % PALETTE.length];

            this.segments.push({
                value,
                count,
                color,
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
                percentage,
            });

            // Create arc path
            const circumference = 2 * Math.PI * this.radius;
            const dashLength = (angle / 360) * circumference;
            const gapLength = circumference - dashLength;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(this.center));
            circle.setAttribute('cy', String(this.center));
            circle.setAttribute('r', String(this.radius));
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', String(this.strokeWidth));
            circle.setAttribute('stroke-linecap', 'butt');
            circle.setAttribute('class', 'donut-segment');

            // Initial state: no visible segment
            circle.setAttribute('stroke-dasharray', `0 ${circumference}`);
            circle.setAttribute('stroke-dashoffset', String(-((currentAngle + 90) / 360) * circumference));

            // Optional: slight gap between segments
            const gap = entries.length > 1 ? 3 : 0;
            const adjustedDash = Math.max(0, dashLength - gap);

            svg.appendChild(circle);

            // Animate with anime.js
            animate(circle, {
                strokeDasharray: `${adjustedDash} ${circumference - adjustedDash}`,
                duration: 800,
                delay: i * 100,
                ease: 'outCubic',
            });

            currentAngle += angle;
        });
    }
}
