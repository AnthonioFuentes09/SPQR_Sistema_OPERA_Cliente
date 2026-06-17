import {
  Component, inject, OnInit, signal, computed, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import Swal from 'sweetalert2';

import { CurveRequestService } from 'app/core/services/training-curves/curve-request.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { CurveRequestDto } from 'app/core/interfaces/training-curves/training-curves.interface';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { OperaFiltersComponent } from 'app/shared/components/opera-filters/opera-filters.component';

@Component({
  selector: 'opera-curve-requests',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ButtonModule, TableModule, TagModule, TooltipModule, ProgressSpinnerModule,
    OperaFiltersComponent,
  ],
  templateUrl: './curve-requests.component.html',
  styleUrl: './curve-requests.component.scss',
})
export class CurveRequestsComponent implements OnInit {
  private readonly _requestService   = inject(CurveRequestService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _requests      = signal<CurveRequestDto[]>([]);
  private readonly _statusFilters = signal<string[]>([]);

  readonly loading     = signal<boolean>(false);
  readonly processing  = signal<number | null>(null); // codeId en proceso
  readonly expandedIds = signal<Set<number>>(new Set());

  readonly requests = this._requests.asReadonly();

  readonly filteredRequests = computed(() => {
    const filters = this._statusFilters();
    if (!filters.length) return this._requests();
    return this._requests().filter(r => filters.includes(r.current_Status));
  });

  readonly statusOptions = computed<BaseItemFilterOptions[]>(() => {
    const statuses = [...new Set(this._requests().map(r => r.current_Status))];
    return statuses.map(s => ({ valueKey: s, description: s }));
  });

  ngOnInit(): void {
    this._loadRequests();
  }

  private async _loadRequests(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this._requestService.getAssignmentRequests$());
      this._requests.set(list ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  onStatusFilter(values: string[]): void {
    this._statusFilters.set(values);
  }

  toggleExpand(id: number): void {
    const set = new Set(this.expandedIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.expandedIds.set(set);
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  // ── Aprobar (sin comentario) ──────────────────────────────────────────
  async approve(req: CurveRequestDto): Promise<void> {
    this.processing.set(req.codeId);
    try {
      const res = await firstValueFrom(
        this._requestService.updateRequestState$(req.codeId, req.assignmentDet_CodeId, {
          state: 'aprobada',
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) await this._loadRequests();
    } finally {
      this.processing.set(null);
    }
  }

  // ── Rechazar (requiere comentario) ───────────────────────────────────
  async reject(req: CurveRequestDto): Promise<void> {
    const { value: comment, isConfirmed } = await Swal.fire<string>({
      title: 'Motivo de rechazo',
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo del rechazo (mínimo 10 caracteres)',
      inputAttributes: { minlength: '10', maxlength: '200' },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) return 'El motivo debe tener al menos 10 caracteres';
        return null;
      },
    });

    if (!isConfirmed || !comment) return;

    this.processing.set(req.codeId);
    try {
      const res = await firstValueFrom(
        this._requestService.updateRequestState$(req.codeId, req.assignmentDet_CodeId, {
          state: 'rechazada',
          comment: comment.trim(),
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) await this._loadRequests();
    } finally {
      this.processing.set(null);
    }
  }

  trackByCodeId(_: number, req: CurveRequestDto): number {
    return req.codeId;
  }
}
