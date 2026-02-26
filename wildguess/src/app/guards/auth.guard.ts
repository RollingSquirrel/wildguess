import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        return true;
    }

    // Try to restore session from token
    const valid = await auth.checkSession();
    if (valid) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
