import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'opera-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './opera-dialog.component.html',
  styleUrl: './opera-dialog.component.scss',
})
export class OperaDialogComponent {
  // ── Inputs / two-way binding ─────────────────────────────────────────────
  readonly visible   = model<boolean>(false);
  readonly header    = input<string>('');
  readonly width     = input<string>('500px');
  readonly draggable = input<boolean>(true);
  readonly resizable = input<boolean>(false);
  readonly modal     = input<boolean>(true);
  readonly closable  = input<boolean>(true);

  // ── Outputs ──────────────────────────────────────────────────────────────
  readonly onHide = output<void>();

  onDialogHide(): void {
    this.visible.set(false);
    this.onHide.emit();
  }
}
