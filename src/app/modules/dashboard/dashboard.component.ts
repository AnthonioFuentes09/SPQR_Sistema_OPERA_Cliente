import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UserService } from 'app/core/services/user/user.service';

@Component({
  selector: 'opera-dashboard',
  standalone: true,
  imports: [CardModule, AsyncPipe],
  template: `
    <div class="dashboard">
      <h2 class="page-title">Dashboard</h2>
      @if (user$ | async; as user) {
        <p-card>
          <p>Bienvenido, <strong>{{ user.user_Name }}</strong>.</p>
          <p class="text-muted-color mt-1">Empresa: {{ user.company_Code }}</p>
        </p-card>
      }
    </div>
  `,
  styles: [`.dashboard { padding: 0; } .page-title { margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; }`],
})
export class DashboardComponent {
  readonly user$ = inject(UserService).user$;
}
