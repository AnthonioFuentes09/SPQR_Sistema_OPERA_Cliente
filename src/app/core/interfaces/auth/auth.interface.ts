import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

export interface AuthSignInRequest {
  employee_Code: string;
  password:      string;
  company_Code:  string;
}

export interface AuthSignInResponse extends ExecutionResponse {
  accessToken?:  string;
  refreshToken?: string;
  access?:       string;
  roles?:        string[];
  user_Code?:    string;
  user_Name?:    string;
  user_Email?:   string;
  company_Code?: string;
}

export interface UserLogged {
  user_Code:                    string;
  user_Name:                    string;
  user_Email:                   string;
  company_Code:                 string;
  roles:                        string[];
  // Campos adicionales de Exenta
  employee_Code?:               string;
  employee_CategoryFromExenta?: string;
}

export interface NavigationItem {
  id:       string;
  title:    string;
  icon?:    string;
  route?:   string;
  type:     'basic' | 'group' | 'collapsable';
  children?: NavigationItem[];
}
