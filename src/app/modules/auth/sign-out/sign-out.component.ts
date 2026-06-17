import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'opera-sign-out',
  standalone: true,
  template: `<div class="flex items-center justify-center min-h-screen">
    <span class="text-muted-color">Cerrando sesión...</span>
  </div>`,
})
export class SignOutComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _router      = inject(Router);

  async ngOnInit(): Promise<void> {
    await firstValueFrom(this._authService.signOut$());
    this._router.navigate(['/sign-in']);
  }
}
