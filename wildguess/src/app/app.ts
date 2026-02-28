import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackgroundParticlesComponent } from './components/background-particles';
import { NotificationComponent } from './ui/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BackgroundParticlesComponent, NotificationComponent],
  template: `
    <app-background-particles />
    <main class="relative z-10 min-h-screen">
      <router-outlet />
    </main>
    <app-notification />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class App {}
