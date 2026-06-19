import { UserDTO, RoleDTO, AccessDTO } from 'app/core/interfaces/security/security.interface';

export const MOCK_USERS: UserDTO[] = [
  { user_Id: 1, user_Code: 'U001', employee_Code: 'U001', user_Name: 'Antonio Fuentes',   user_Email: 'afuentes@imhon.com',   company_Code: 'IMHON', role_Id: 1, role_Name: 'ADMIN',       is_Active: true,  is_Deleted: false },
  { user_Id: 2, user_Code: 'U002', employee_Code: 'U002', user_Name: 'María López',       user_Email: 'mlopez@imhon.com',     company_Code: 'IMHON', role_Id: 2, role_Name: 'INSTRUCTOR',  is_Active: true,  is_Deleted: false },
  { user_Id: 3, user_Code: 'U003', employee_Code: 'U003', user_Name: 'Carlos Hernández',  user_Email: 'chernandez@imhon.com', company_Code: 'IMHON', role_Id: 3, role_Name: 'SUPERVISOR',  is_Active: true,  is_Deleted: false },
  { user_Id: 4, user_Code: 'U004', employee_Code: 'U004', user_Name: 'Sofía Martínez',    user_Email: 'smartinez@imhon.com',  company_Code: 'IMHON', role_Id: 4, role_Name: 'VIEWER',      is_Active: false, is_Deleted: false },
  { user_Id: 5, user_Code: 'U005', employee_Code: 'U005', user_Name: 'Javier Rodríguez',  user_Email: 'jrodriguez@imhon.com', company_Code: 'IMHON', role_Id: 2, role_Name: 'INSTRUCTOR',  is_Active: true,  is_Deleted: false },
];

export const MOCK_ROLES: RoleDTO[] = [
  { role_Id: 1, role_Code: 'ADMIN',       role_Description: 'Administrador del Sistema', is_Active: true,  is_Deleted: false },
  { role_Id: 2, role_Code: 'INSTRUCTOR',  role_Description: 'Instructor de Entrenamiento', is_Active: true, is_Deleted: false },
  { role_Id: 3, role_Code: 'SUPERVISOR',  role_Description: 'Supervisor de Planta',      is_Active: true,  is_Deleted: false },
  { role_Id: 4, role_Code: 'VIEWER',      role_Description: 'Solo Lectura',              is_Active: true,  is_Deleted: false },
];

export const MOCK_ACCESSES: AccessDTO[] = [
  { access_Id: 1, access_Code: 'security.users',       access_Description: 'Gestión de Usuarios',      access_Route: '/security/users',                role_Id: 1, role_Description: 'Administrador', is_Active: true },
  { access_Id: 2, access_Code: 'security.roles',       access_Description: 'Gestión de Roles',         access_Route: '/security/roles',                role_Id: 1, role_Description: 'Administrador', is_Active: true },
  { access_Id: 3, access_Code: 'security.access',      access_Description: 'Gestión de Accesos',       access_Route: '/security/access',               role_Id: 1, role_Description: 'Administrador', is_Active: true },
  { access_Id: 4, access_Code: 'training.assignment',  access_Description: 'Asignación de Curvas',     access_Route: '/training/curve-assignment',      role_Id: 2, role_Description: 'Instructor',    is_Active: true },
  { access_Id: 5, access_Code: 'training.tracking',    access_Description: 'Seguimiento de Curvas',    access_Route: '/training/curve-tracking',        role_Id: 2, role_Description: 'Instructor',    is_Active: true },
  { access_Id: 6, access_Code: 'training.requests',    access_Description: 'Solicitudes de Cambio',    access_Route: '/training/curve-requests',        role_Id: 3, role_Description: 'Supervisor',    is_Active: true },
  { access_Id: 7, access_Code: 'training.operators',   access_Description: 'Gestión de Operarios',     access_Route: '/training/operators-management',  role_Id: 2, role_Description: 'Instructor',    is_Active: true },
  { access_Id: 8, access_Code: 'training.config',      access_Description: 'Configuración de Curvas',  access_Route: '/training/config/training-curves', role_Id: 1, role_Description: 'Administrador', is_Active: true },
];
