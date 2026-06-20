import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule }  from 'primeng/button';
import { ToastModule }   from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { SidenavComponent }  from 'app/layout/sidebar/sidenav.component';
import { HeaderComponent }   from 'app/layout/header/header.component';
import { MOCK_NAVIGATION }   from 'app/core/mock/data/auth.mock';
import { NavigationItem }    from 'app/core/interfaces/auth/auth.interface';

@Component({
  selector: 'opera-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarModule, ButtonModule, ToastModule, SidenavComponent, HeaderComponent],
  providers: [MessageService],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly _unsubscribeAll = new Subject<void>();

  readonly sidebarVisible  = signal(true);
  readonly isMobile        = signal(false);
  readonly navItems        = signal<NavigationItem[]>([]);

  ngOnInit(): void {
    this._checkMobile(window.innerWidth);
    // En producción: cargar desde NavigationService + API
    this.navItems.set(MOCK_NAVIGATION as NavigationItem[]);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // F-07: @HostListener en lugar de window.addEventListener directo
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: UIEvent): void {
    this._checkMobile((event.target as Window).innerWidth);
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  private _checkMobile(width: number): void {
    const mobile = width < 1024;  // tablet y móvil usan sidebar overlay
    this.isMobile.set(mobile);
    if (mobile) this.sidebarVisible.set(false);
    else         this.sidebarVisible.set(true);
  }
}
