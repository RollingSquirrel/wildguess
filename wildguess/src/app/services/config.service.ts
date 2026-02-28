import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, catchError, of, tap } from 'rxjs';

export interface AppConfig {
  pollingRate: number;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private configSubject = new ReplaySubject<AppConfig>(1);
  config$ = this.configSubject.asObservable();

  private fetching = false;

  getPollingRate(): Observable<number> {
    if (!this.fetching) {
      this.fetching = true;
      this.http
        .get<AppConfig>('api/config')
        .pipe(
          tap((config) => this.configSubject.next(config)),
          catchError((err) => {
            console.error('Failed to load config, using defaults', err);
            const defaultConfig: AppConfig = { pollingRate: 3000 };
            this.configSubject.next(defaultConfig);
            return of(defaultConfig);
          }),
        )
        .subscribe();
    }

    return new Observable<number>((observer) => {
      return this.config$.subscribe((config) => {
        observer.next(config.pollingRate);
      });
    });
  }
}
