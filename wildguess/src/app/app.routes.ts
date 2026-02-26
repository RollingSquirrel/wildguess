import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    },
    {
        path: 'room/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/room/room.page').then((m) => m.RoomPage),
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];
