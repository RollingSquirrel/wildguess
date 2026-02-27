import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackgroundParticlesComponent } from './components/background-particles';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BackgroundParticlesComponent],
  template: `
    <app-background-particles />
    <main class="relative z-10 min-h-screen">
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class App {}
