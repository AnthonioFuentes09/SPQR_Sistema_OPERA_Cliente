import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, OperatorFunction, catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

@Injectable({ providedIn: 'root' })
export class ExceptionService {
  private readonly _toastr = inject(ToastrService);

  /**
   * Operador RxJS para endpoints que retornan ExecutionResponse (o subtipos).
   * Muestra toast de error y retorna `{ success: false, errorMessage }` como fallback.
   * Úsalo en el pipe del servicio — NUNCA en el componente.
   */
  handleExecutionError<T extends ExecutionResponse>(): OperatorFunction<T, T> {
    return catchError((err: HttpErrorResponse): Observable<T> => {
      const errorMessage = err.status === 0
        ? 'No se pudo conectar con el servidor. Por favor revise con soporte IT.'
        : (err.error?.errorMessage ?? err.message ?? 'Ha ocurrido un error inesperado.');

      this._toastr.error(errorMessage, 'Error', { timeOut: 4000 });

      return of({ success: false, errorMessage } as T);
    });
  }

  /**
   * Operador RxJS para endpoints que retornan tipos arbitrarios (p.ej. arrays).
   * Muestra toast de error y retorna `fallback` como valor por defecto.
   */
  handleError<T>(fallback: T): OperatorFunction<T, T> {
    return catchError((err: HttpErrorResponse): Observable<T> => {
      const errorMessage = err.status === 0
        ? 'No se pudo conectar con el servidor. Por favor revise con soporte IT.'
        : (err.error?.errorMessage ?? err.message ?? 'Ha ocurrido un error inesperado.');

      this._toastr.error(errorMessage, 'Error', { timeOut: 4000 });

      return of(fallback);
    });
  }

  /** Muestra toast de éxito o error según el resultado de una operación. */
  showToastResult(response: ExecutionResponse): void {
    if (response.success) {
      this._toastr.success(response.successMessage ?? 'Operación exitosa.', 'Éxito', { timeOut: 3000 });
    } else {
      this._toastr.error(response.errorMessage ?? 'Ha ocurrido un error.', 'Error', { timeOut: 4000 });
    }
  }

  showError(message: string): void {
    this._toastr.error(message, 'Error', { timeOut: 4000 });
  }

  showSuccess(message: string): void {
    this._toastr.success(message, 'Éxito', { timeOut: 3000 });
  }

  /** Muestra diálogo de confirmación con SweetAlert2. Retorna true si el usuario confirma. */
  async askConfirmation(html: string, confirmText = 'Confirmar', cancelText = 'Cancelar'): Promise<boolean> {
    const result = await Swal.fire({
      html,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#ef4444',
      icon: 'warning',
    });
    return result.isConfirmed;
  }
}
