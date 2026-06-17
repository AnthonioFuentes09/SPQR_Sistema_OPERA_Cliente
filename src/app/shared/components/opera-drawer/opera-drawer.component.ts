import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';

/**
 * Panel lateral deslizante — equivalente al mat-drawer de PAYWEB.
 * Uso:
 *   <opera-drawer [(visible)]="drawerVisible" title="Editar" subtitle="code">
 *     <!-- form body -->
 *     <div footer>
 *       <button class="pw-btn-cancel" (click)="close()">Cancelar</button>
 *       <button class="pw-btn-save"   (click)="save()">Guardar</button>
 *     </div>
 *   </opera-drawer>
 */
@Component({
  selector: 'opera-drawer',
  standalone: true,
  imports: [CommonModule, DrawerModule],
  templateUrl: './opera-drawer.component.html',
  styleUrl: './opera-drawer.component.scss',
})
export class OperaDrawerComponent {
  readonly visible  = model<boolean>(false);
  readonly title    = input<string>('');
  readonly subtitle = input<string>('');
  readonly width    = input<string>('520px');
  readonly modal    = input<boolean>(true);

  readonly closed = output<void>();

  close(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
