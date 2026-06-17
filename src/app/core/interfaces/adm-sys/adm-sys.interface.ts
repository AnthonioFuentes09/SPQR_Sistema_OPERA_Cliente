import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

export interface ActionDTO {
  action_Id:          number;
  action_Code:        string;
  action_Name?:       string;        // nombre legible
  action_Description: string;
  action_Route:       string;
  is_Active:          boolean;
  is_Deleted:         boolean;
}

export interface ResponseActionDTO extends ExecutionResponse {
  actions: ActionDTO[];
}

export interface DisplayDTO {
  display_Id:          number;
  display_Code:        string;
  display_Name?:       string;       // nombre legible
  display_Description: string;
  display_Route:       string;
  display_Icon?:       string;
  is_Active:           boolean;
  is_Deleted:          boolean;
}

export interface ResponseDisplayDto extends ExecutionResponse {
  displays: DisplayDTO[];
}

export interface SystemEntityDTO {
  entity_Id:          number;
  entity_Code:        string;
  entity_Name?:       string;        // nombre legible
  entity_Description: string;
  company_Code:       string;
  is_Active:          boolean;
}

export interface ResponseSystemEntitiesDto extends ExecutionResponse {
  entities: SystemEntityDTO[];
}

export interface BaseItemFilterOptions {
  valueKey:    string;
  description: string;
}
