import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { AuthService } from 'app/core/services/auth/auth.service';
import { UserService } from 'app/core/services/user/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'opera-header',
  standalone: true,
  imports: [CommonModule, MenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input()  sidebarVisible = true;
  @Output() toggleSidebar  = new EventEmitter<void>();

  private readonly _authService = inject(AuthService);
  private readonly _userService = inject(UserService);
  private readonly _router      = inject(Router);

  readonly user$ = this._userService.user$;

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  readonly userMenuItems: MenuItem[] = [
    {
      label:   'Mi perfil',
      icon:    'pi pi-user',
      command: () => {},
    },
    { separator: true },
    {
      label:   'Cerrar sesión',
      icon:    'pi pi-sign-out',
      command: () => this._signOut(),
    },
  ];

  private async _signOut(): Promise<void> {
    await firstValueFrom(this._authService.signOut$());
    this._router.navigate(['/sign-in']);
  }
}
