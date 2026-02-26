import {
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    viewChild,
    afterNextRender,
    OnDestroy,
} from '@angular/core';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    alphaDir: number;
    life: number;
    maxLife: number;
}

@Component({
    selector: 'app-background-particles',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<canvas #canvas aria-hidden="true"></canvas>`,
    styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `,
})
export class BackgroundParticlesComponent implements OnDestroy {
    private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
    private animationId = 0;
    private particles: Particle[] = [];
    private resizeObserver: ResizeObserver | null = null;

    constructor() {
        afterNextRender(() => this.init());
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.animationId);
        this.resizeObserver?.disconnect();
    }

    private init(): void {
        const canvas = this.canvasRef().nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        this.resizeObserver = new ResizeObserver(resize);
        this.resizeObserver.observe(document.body);

        // Initialize particles
        const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 25000));
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(canvas.width, canvas.height));
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.life++;

                // Flicker alpha like fire sparks
                p.alpha += p.alphaDir * 0.008;
                if (p.alpha >= 0.6) p.alphaDir = -1;
                if (p.alpha <= 0.05) p.alphaDir = 1;

                // Subtle upward drift (fire sparks rise)
                p.vy -= 0.002;

                // Reset if off screen or expired
                if (
                    p.x < -10 ||
                    p.x > canvas.width + 10 ||
                    p.y < -10 ||
                    p.y > canvas.height + 10 ||
                    p.life > p.maxLife
                ) {
                    Object.assign(p, this.createParticle(canvas.width, canvas.height));
                }

                // Draw glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                gradient.addColorStop(0, `rgba(0, 230, 118, ${p.alpha})`);
                gradient.addColorStop(0.4, `rgba(0, 200, 100, ${p.alpha * 0.4})`);
                gradient.addColorStop(1, 'rgba(0, 230, 118, 0)');

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Draw core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 230, 118, ${p.alpha})`;
                ctx.fill();
            }

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    private createParticle(w: number, h: number): Particle {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.1,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.3 + 0.05,
            alphaDir: Math.random() > 0.5 ? 1 : -1,
            life: 0,
            maxLife: Math.random() * 600 + 300,
        };
    }
}
