import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CurveDto,
  OperationsCategoriesDto,
  OperationsDto,
  ResponseCurvesDto,
} from 'app/core/interfaces/training-config/training-config.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';
import {
  MOCK_CATEGORIES,
  MOCK_CURVES,
  MOCK_OPERATIONS,
} from 'app/core/mock/data/training-config.mock';

@Injectable({ providedIn: 'root' })
export class TrainingConfigService {

  // ── In-memory state ───────────────────────────────────────────────────────
  private readonly _curves = signal<CurveDto[]>(
    MOCK_CURVES.map(c => ({ ...c, selectedWeeks: [...c.selectedWeeks] })),
  );

  // ── Lectura ───────────────────────────────────────────────────────────────

  getCurves$(): Observable<ResponseCurvesDto> {
    return of({ success: true, curves: this._curves() });
  }

  getCategories$(): Observable<OperationsCategoriesDto[]> {
    return of([...MOCK_CATEGORIES]);
  }

  getOperationsByCategory$(): Observable<OperationsDto[]> {
    return of([...MOCK_OPERATIONS]);
  }

  // ── Escritura ─────────────────────────────────────────────────────────────

  createCurve$(body: Omit<CurveDto, 'code'>): Observable<ExecutionResponse> {
    const cat       = body.catExenta_AlphaNumId;
    const existing  = this._curves().filter(c => c.catExenta_AlphaNumId === cat);
    const nextNum   = String(existing.length + 1).padStart(3, '0');
    const code      = `C_${cat}_${nextNum}`;

    const newCurve: CurveDto = {
      ...body,
      code,
      canti_Semanas: body.selectedWeeks.length,
      canti_Opers:   body.selectedOperations.length,
    };

    this._curves.update(list => [...list, newCurve]);
    return of({ success: true, successMessage: 'Curva creada exitosamente.' });
  }

  updateCurve$(body: CurveDto): Observable<ExecutionResponse> {
    this._curves.update(list =>
      list.map(c => c.code === body.code
        ? {
            ...body,
            canti_Semanas: body.selectedWeeks.length,
            canti_Opers:   body.selectedOperations.length,
          }
        : c,
      ),
    );
    return of({ success: true, successMessage: 'Curva actualizada exitosamente.' });
  }

  deleteCurve$(code: string): Observable<ExecutionResponse> {
    this._curves.update(list => list.filter(c => c.code !== code));
    return of({ success: true, successMessage: 'Curva eliminada exitosamente.' });
  }
}
