import { EmployeeAssignmentDTO, CurveTrackDto, UserTrainingDto, CurveRequestDto, InstructorDto } from 'app/core/interfaces/training-curves/training-curves.interface';
import { CurveDto } from 'app/core/interfaces/training-config/training-config.interface';

export const MOCK_INSTRUCTORS: InstructorDto[] = [
  { trainer_Code: 'I001', trainer_Name: 'Roberto Castillo' },
  { trainer_Code: 'I002', trainer_Name: 'Elena Morales' },
  { trainer_Code: 'I003', trainer_Name: 'Miguel Torres' },
];

export const MOCK_ASSIGNMENTS: EmployeeAssignmentDTO[] = [
  {
    codeId: 1, employee_Code: 'E001', employee_Name: 'Juan Pablo Reyes',
    curve_Code: 'C_M_001', curve_Version: 1, area_AlphaNumId: 'COSTURA',
    date_Assignment: '2026-01-06', statePeriod: 'en-proceso',
    curveTypeCode: 'T', initialWeek: 1, finalWeek: 12, duration: 12,
    lvlStart: 1, trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
    weeks: [
      { codeId: 101, assignment_CodeId: 1, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 1,
        curve_Level: 1, base_Hours: 48, target_Efficiency: 60, real_Efficiency: 58, real_Pieces: 320,
        base_Pieces: 350, assignment_Progress: 'completada', trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
        comments: '', instructorComments: 'Buen avance', weekState: 'none' },
      { codeId: 102, assignment_CodeId: 1, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 2,
        curve_Level: 1, base_Hours: 48, target_Efficiency: 65, real_Efficiency: 62, real_Pieces: 345,
        base_Pieces: 370, assignment_Progress: 'completada', trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
        comments: '', instructorComments: '', weekState: 'none' },
      { codeId: 103, assignment_CodeId: 1, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 3,
        curve_Level: 2, base_Hours: 48, target_Efficiency: 70, real_Efficiency: null, real_Pieces: null,
        base_Pieces: 400, assignment_Progress: 'en-progreso', trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
        comments: '', instructorComments: '', weekState: 'none' },
      { codeId: 104, assignment_CodeId: 1, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 4,
        curve_Level: 2, base_Hours: 48, target_Efficiency: 75, real_Efficiency: null, real_Pieces: null,
        base_Pieces: 430, assignment_Progress: 'por-hacer', trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
        comments: '', instructorComments: '', weekState: 'none' },
    ],
  },
  {
    codeId: 2, employee_Code: 'E002', employee_Name: 'Ana Lucía Vargas',
    curve_Code: 'C_M_002', curve_Version: 1, area_AlphaNumId: 'ENSAMBLE',
    date_Assignment: '2026-01-13', statePeriod: 'en-proceso',
    curveTypeCode: 'T', initialWeek: 2, finalWeek: 13, duration: 12,
    lvlStart: 1, trainer_Code: 'I002', trainer_Name: 'Elena Morales',
    weeks: [
      { codeId: 201, assignment_CodeId: 2, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 2,
        curve_Level: 1, base_Hours: 48, target_Efficiency: 55, real_Efficiency: 53, real_Pieces: 290,
        base_Pieces: 310, assignment_Progress: 'completada', trainer_Code: 'I002', trainer_Name: 'Elena Morales',
        comments: '', instructorComments: 'Necesita mejorar velocidad', weekState: 'none' },
      { codeId: 202, assignment_CodeId: 2, assignment_Year: 2026, assignment_Month: 1, assignment_Week: 3,
        curve_Level: 1, base_Hours: 48, target_Efficiency: 60, real_Efficiency: null, real_Pieces: null,
        base_Pieces: 330, assignment_Progress: 'en-progreso', trainer_Code: 'I002', trainer_Name: 'Elena Morales',
        comments: '', instructorComments: '', weekState: 'none' },
    ],
  },
  {
    codeId: 3, employee_Code: 'E003', employee_Name: 'Marcos Díaz Pineda',
    curve_Code: 'C_M_001', curve_Version: 1, area_AlphaNumId: 'COSTURA',
    date_Assignment: '2025-10-06', statePeriod: 'completada',
    curveTypeCode: 'T', initialWeek: 40, finalWeek: 51, duration: 12,
    lvlStart: 1, trainer_Code: 'I003', trainer_Name: 'Miguel Torres',
    weeks: [],
  },
];

export const MOCK_TRACKING: CurveTrackDto[] = [
  {
    employee_Code: 'E001', employee_Name: 'Juan Pablo Reyes',
    curve_Code: 'C_M_001', assignment_Id: 1, codeId: 101,
    assignment_Week: 3, curve_Level: 1,
    target_Efficiency: 80, real_Efficiency: 75, real_Pieces: 120,
    assignment_Progress: 'en-progreso', isCurrentWeek: true,
    trainer_Code: 'I001',
  },
  {
    employee_Code: 'E002', employee_Name: 'Ana Lucia Vargas',
    curve_Code: 'C_M_002', assignment_Id: 2, codeId: 201,
    assignment_Week: 2, curve_Level: 1,
    target_Efficiency: 70, real_Efficiency: null, real_Pieces: null,
    assignment_Progress: 'por-hacer', isCurrentWeek: true,
    trainer_Code: 'I002',
  },
];

export const MOCK_OPERATORS: UserTrainingDto[] = [
  { employee_Code: 'E001', employee_Name: 'Juan Pablo Reyes',   trainer_Code: 'I001', trainer_Name: 'Roberto Castillo', curve_Code: 'C_M_001', status: 'en-proceso'  },
  { employee_Code: 'E002', employee_Name: 'Ana Lucía Vargas',   trainer_Code: 'I002', trainer_Name: 'Elena Morales',    curve_Code: 'C_M_002', status: 'en-proceso'  },
  { employee_Code: 'E003', employee_Name: 'Marcos Díaz Pineda', trainer_Code: 'I003', trainer_Name: 'Miguel Torres',    curve_Code: 'C_M_001', status: 'completada'  },
];

export const MOCK_REQUESTS: CurveRequestDto[] = [
  {
    codeId: 1, assignmentDet_CodeId: 103, employee_Code: 'E001', employee_Name: 'Juan Pablo Reyes',
    week_Number: 3, current_Status: 'en-progreso', requested_Status: 'en-pausa',
    request_Date: '2026-01-15', comments: 'El operario tuvo incapacidad médica esta semana.',
    trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
  },
  {
    codeId: 2, assignmentDet_CodeId: 202, employee_Code: 'E002', employee_Name: 'Ana Lucía Vargas',
    week_Number: 3, current_Status: 'en-progreso', requested_Status: 'cancelada',
    request_Date: '2026-01-16', comments: 'La operaria fue transferida a otra línea de producción.',
    trainer_Code: 'I002', trainer_Name: 'Elena Morales',
  },
];

export const MOCK_CURVES: CurveDto[] = [
  {
    curve_Code: 'C_M_001', curve_Version: 1, curve_Description: 'Curva Básica Costura',
    curve_Category: 'M', opExenta_AlphaNumId: 'OP001', operation_Name: 'Operación de Costura Lineal',
    is_Active: true,
    weeks: [
      { week_Number: 1, curve_Level: 1, base_Hours: 48, target_Efficiency: 60, base_Pieces: 350 },
      { week_Number: 2, curve_Level: 1, base_Hours: 48, target_Efficiency: 65, base_Pieces: 370 },
      { week_Number: 3, curve_Level: 2, base_Hours: 48, target_Efficiency: 70, base_Pieces: 400 },
      { week_Number: 4, curve_Level: 2, base_Hours: 48, target_Efficiency: 75, base_Pieces: 430 },
      { week_Number: 5, curve_Level: 3, base_Hours: 48, target_Efficiency: 80, base_Pieces: 460 },
      { week_Number: 6, curve_Level: 3, base_Hours: 48, target_Efficiency: 85, base_Pieces: 500 },
    ],
  },
  {
    curve_Code: 'C_M_002', curve_Version: 1, curve_Description: 'Curva Ensamble',
    curve_Category: 'M', opExenta_AlphaNumId: 'OP002', operation_Name: 'Ensamble de Componentes',
    is_Active: true,
    weeks: [
      { week_Number: 1, curve_Level: 1, base_Hours: 48, target_Efficiency: 55, base_Pieces: 310 },
      { week_Number: 2, curve_Level: 1, base_Hours: 48, target_Efficiency: 60, base_Pieces: 330 },
      { week_Number: 3, curve_Level: 2, base_Hours: 48, target_Efficiency: 68, base_Pieces: 380 },
      { week_Number: 4, curve_Level: 2, base_Hours: 48, target_Efficiency: 75, base_Pieces: 420 },
    ],
  },
];
