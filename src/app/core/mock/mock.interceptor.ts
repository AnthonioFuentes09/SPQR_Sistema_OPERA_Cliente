import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from 'environments/environment';
import { AuthSignInRequest, AuthSignInResponse } from 'app/core/interfaces/auth/auth.interface';
import { MOCK_AUTH_RESPONSE, MOCK_NAVIGATION, MOCK_AUTH_USERS } from 'app/core/mock/data/auth.mock';
import { MOCK_USERS, MOCK_ROLES, MOCK_ACCESSES } from 'app/core/mock/data/security.mock';
import {
  MOCK_ASSIGNMENTS, MOCK_TRACKING, MOCK_OPERATORS,
  MOCK_REQUESTS, MOCK_CURVES, MOCK_INSTRUCTORS,
} from 'app/core/mock/data/training.mock';

const DELAY_MS = 250; // Simula latencia de red

function respond(body: unknown, status = 200) {
  return of(new HttpResponse({ status, body })).pipe(delay(DELAY_MS));
}

/**
 * Mock interceptor funcional (Angular 18).
 * Solo activo cuando environment.useMocks === true.
 * Intercepta peticiones por URL y devuelve datos falsos.
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMocks) return next(req);

  const url    = req.url;
  const method = req.method;

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (url.includes('Auth/SignIn')) {
    const credentials = req.body as AuthSignInRequest;
    const user = MOCK_AUTH_USERS.find(u =>
      u.employee_Code === credentials.employee_Code &&
      u.password === credentials.password &&
      u.company_Code === credentials.company_Code
    );

    if (!user) {
      return respond({ success: false, errorMessage: 'Credenciales incorrectas. Intente nuevamente.' }, 401);
    }

    return respond({
      success:      true,
      accessToken:  'mock.jwt.token.access',
      refreshToken: 'mock.jwt.token.refresh',
      access:       user.access,
      roles:        user.roles,
      user_Code:    user.user_Code,
      user_Name:    user.user_Name,
      user_Email:   user.user_Email,
      company_Code: user.company_Code,
    } as AuthSignInResponse);
  }

  if (url.includes('Auth/SignInWithToken'))
    return respond(MOCK_AUTH_RESPONSE);

  if (url.includes('Auth/RefreshToken'))
    return respond({ ...MOCK_AUTH_RESPONSE, accessToken: 'mock.jwt.token.refreshed' });

  if (url.includes('Auth/SignOut'))
    return respond({ success: true, successMessage: 'Sesión cerrada correctamente.' });

  if (url.includes('Auth/UserNavigation'))
    return respond(MOCK_NAVIGATION);

  // ── Security: Users ─────────────────────────────────────────────────────────
  if (url.includes('Security/Users') || url.includes('Security/users')) {
    if (method === 'GET') {
      // Map role_Name based on role_Id
      const usersWithRoles = MOCK_USERS.map(user => {
        const role = MOCK_ROLES.find(r => r.role_Id === user.role_Id);
        return {
          ...user,
          role_Name: role?.role_Code ?? 'Viewer',
        };
      });
      return respond({ success: true, users: usersWithRoles });
    }

    if (method === 'POST') {
      const body = req.body as any;
      const code = (body.employee_Code ?? body.user_Code ?? '').trim();
      if (!code) {
        return respond({ success: false, errorMessage: 'El código de empleado es obligatorio.' }, 400);
      }

      if (MOCK_USERS.some(u => (u.employee_Code ?? '').toLowerCase() === code.toLowerCase())) {
        return respond({ success: false, errorMessage: 'El código de empleado ya está en uso por otro usuario.' }, 400);
      }

      const nextId = Math.max(0, ...MOCK_USERS.map(u => u.user_Id)) + 1;
      const role = MOCK_ROLES.find(r => r.role_Id === body.role_Id);
      MOCK_USERS.push({
        user_Id:       nextId,
        user_Code:     code,
        employee_Code: code,
        user_Name:     body.user_Name ?? '',
        user_Email:    body.user_Email ?? '',
        company_Code:  body.company_Code ?? 'IMHON',
        role_Id:       body.role_Id,
        role_Name:     role?.role_Code ?? 'Viewer',
        is_Active:     body.is_Active ?? true,
        is_Deleted:    body.is_Deleted ?? false,
      });

      return respond({ success: true, successMessage: 'Usuario creado correctamente.' });
    }

    if (method === 'PUT') {
      const body = req.body as any;
      const userId = Number(body.user_Id ?? 0);
      const index = MOCK_USERS.findIndex(u => u.user_Id === userId);
      if (index < 0) return respond({ success: false, errorMessage: 'Usuario no encontrado.' }, 404);

      const code = (body.employee_Code ?? body.user_Code ?? MOCK_USERS[index].employee_Code ?? '').trim();
      if (!code) {
        return respond({ success: false, errorMessage: 'El código de empleado es obligatorio.' }, 400);
      }

      if (MOCK_USERS.some(u => u.user_Id !== userId && (u.employee_Code ?? '').toLowerCase() === code.toLowerCase())) {
        return respond({ success: false, errorMessage: 'El código de empleado ya está en uso por otro usuario.' }, 400);
      }
      const role = MOCK_ROLES.find(r => r.role_Id === (body.role_Id ?? MOCK_USERS[index].role_Id));
      MOCK_USERS[index] = {
        ...MOCK_USERS[index],
        ...body,
        user_Code:     code,
        employee_Code: code,
        role_Name:     role?.role_Code ?? 'Viewer',
      };

      return respond({ success: true, successMessage: 'Usuario actualizado correctamente.' });
    }

    if (method === 'DELETE') {
      const userId = Number(req.params.get('user_Id') ?? 0);
      const index = MOCK_USERS.findIndex(u => u.user_Id === userId);
      if (index >= 0) {
        MOCK_USERS.splice(index, 1);
        return respond({ success: true, successMessage: 'Usuario eliminado correctamente.' });
      }
      return respond({ success: false, errorMessage: 'Usuario no encontrado.' }, 404);
    }
  }

  // ── Security: Roles ─────────────────────────────────────────────────────────
  if (url.includes('Security/Roles') || url.includes('Security/roles')) {
    if (method === 'GET')   return respond({ success: true, roles: MOCK_ROLES });
    if (method === 'POST')  return respond({ success: true, successMessage: 'Rol creado correctamente.' });
    if (method === 'PATCH') return respond({ success: true, successMessage: 'Rol actualizado correctamente.' });
  }

  // ── Security: Access ─────────────────────────────────────────────────────────
  if (url.includes('Security/Access') || url.includes('Security/access')) {
    if (method === 'GET')   return respond({ success: true, accesses: MOCK_ACCESSES });
    if (method === 'POST')  return respond({ success: true, successMessage: 'Acceso asignado correctamente.' });
    if (method === 'DELETE')return respond({ success: true, successMessage: 'Acceso removido correctamente.' });
  }

  // ── Training: Assignments ───────────────────────────────────────────────────
  if (url.includes('TrainingCurve/employee-assignments'))
    return respond({ success: true, assignments: MOCK_ASSIGNMENTS });

  if (url.includes('TrainingCurve/employee-assignment')) {
    if (method === 'POST')  return respond({ success: true, successMessage: 'Asignación creada correctamente.' });
    if (method === 'DELETE')return respond({ success: true, successMessage: 'Asignación eliminada correctamente.' });
  }

  if (url.includes('TrainingCurve/PatchEmployeeWeekCurveValues'))
    return respond({ success: true, successMessage: 'Valores actualizados correctamente.' });

  if (url.includes('TrainingCurve/assignment-weeks-config') ||
      url.includes('TrainingCurve/new-week-level-for-assignment'))
    return respond({ success: true, successMessage: 'Semanas actualizadas correctamente.' });

  if (url.includes('TrainingCurve/instructors-comment-assignment'))
    return respond({ success: true, successMessage: 'Comentario guardado.' });

  if (url.includes('TrainingCurve/week-status-employee-assignment'))
    return respond({ success: true, successMessage: 'Estado actualizado.' });

  // ── Training: Tracking ──────────────────────────────────────────────────────
  if (url.includes('TrainingCurve/curves') && url.includes('current-tracking'))
    return respond({ success: true, tracking: MOCK_TRACKING });

  // ── Training: Operators ─────────────────────────────────────────────────────
  if (url.includes('TrainingCurve/employees-training'))
    return respond({ success: true, operators: MOCK_OPERATORS, instructors: MOCK_INSTRUCTORS });

  if (url.includes('TrainingCurve/employee-trainer'))
    return respond({ success: true, successMessage: 'Instructor asignado correctamente.' });

  // ── Training: Requests ──────────────────────────────────────────────────────
  if (url.includes('CurveRequest/assignment-requests'))
    return respond({ success: true, requests: MOCK_REQUESTS });

  if (url.includes('CurveRequest/assignment-request')) {
    if (method === 'PATCH') return respond({ success: true, successMessage: 'Solicitud procesada correctamente.' });
    if (method === 'DELETE')return respond({ success: true, successMessage: 'Solicitud eliminada.' });
  }

  // ── Training Config ─────────────────────────────────────────────────────────
  if (url.includes('TrainingConfig/training-config')) {
    if (method === 'GET')   return respond({ success: true, curves: MOCK_CURVES });
    if (method === 'POST')  return respond({ success: true, successMessage: 'Curva creada correctamente.' });
    if (method === 'PATCH') return respond({ success: true, successMessage: 'Curva actualizada correctamente.' });
    if (method === 'DELETE')return respond({ success: true, successMessage: 'Semana eliminada correctamente.' });
  }

  // ── Exenta: Instructors ─────────────────────────────────────────────────────
  if (url.includes('Exenta/instructors'))
    return respond(MOCK_INSTRUCTORS);

  // Si no hay match, pasar al siguiente interceptor (o al HTTP real)
  return next(req);
};
