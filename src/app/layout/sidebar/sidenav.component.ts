import { Component, Input, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationItem } from 'app/core/interfaces/auth/auth.interface';
import { UserService } from 'app/core/services/user/user.service';

@Component({
  selector: 'opera-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  @Input() items:     NavigationItem[] = [];
  @Input() collapsed: boolean = false;

  private readonly _userService = inject(UserService);

  readonly user$ = this._userService.user$;

  readonly openGroups = signal<Set<string>>(new Set());

  isOpen(id: string): boolean {
    return this.openGroups().has(id);
  }

  toggleGroup(id: string): void {
    this.openGroups.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}
