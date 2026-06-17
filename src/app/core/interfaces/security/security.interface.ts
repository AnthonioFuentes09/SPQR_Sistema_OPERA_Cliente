import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

// ── Usuarios ──────────────────────────────────────────────────────────────────
export interface UserDTO {
  user_Id:          number;
  user_Code:        string;
  user_Name:        string;
  user_Email:       string;
  company_Code:     string;
  is_Active:        boolean;
  is_Deleted:       boolean;
  roles?:           RoleDTO[];
  // Campos adicionales de uso frecuente
  employee_Code?:   string;
  role_Id?:         number;
  role_Name?:       string;
}

export interface ResponseUsersDto extends ExecutionResponse {
  users: UserDTO[];
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export interface RoleDTO {
  role_Id:          number;
  role_Code:        string;
  role_Name?:       string;          // alias legible de role_Code
  role_Description: string;
  is_Active:        boolean;
  is_Deleted:       boolean;
}

export interface ResponseRolesDto extends ExecutionResponse {
  roles: RoleDTO[];
}

// ── Accesos ───────────────────────────────────────────────────────────────────
export interface AccessDTO {
  access_Id:          number;
  access_Code:        string;
  access_Name?:       string;        // nombre legible
  access_Description: string;
  access_Route:       string;
  access_Module?:     string;        // módulo al que pertenece
  role_Id:            number;
  role_Description?:  string;
  is_Active:          boolean;
}

export interface ResponseAccessDto extends ExecutionResponse {
  accesses: AccessDTO[];
}

// ── Navegación ────────────────────────────────────────────────────────────────
export interface UserNavigationItem {
  item_Id:       number;
  item_Title:    string;
  item_Icon?:    string;
  item_Route?:   string;
  item_Type:     'basic' | 'group' | 'collapsable';
  parent_Id?:    number;
  order_Index:   number;
}
