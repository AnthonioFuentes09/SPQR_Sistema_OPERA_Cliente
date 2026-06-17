import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'opera-not-found',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <p-button label="Ir al inicio" icon="pi pi-home" routerLink="/dashboard" />
    </div>
  `,
  styles: [`.not-found { text-align:center; padding: 4rem; h1 { font-size: 4rem; color: var(--p-primary-color); } p { color: var(--p-text-muted-color); margin-bottom: 2rem; } }`],
})
export class NotFoundComponent {}
