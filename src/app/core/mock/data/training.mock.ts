import {
  CurveTrackDto,
  CurveRequestDto,
  InstructorDto,
  UserTrainingDto,
  WeekStatus,
  CurveStatus,
  EmployeeAssignmentDTO,
} from 'app/core/interfaces/training-curves/training-curves.interface';
import { CurveDto } from 'app/core/interfaces/training-config/training-config.interface';

// ─────────────────────────────────────────────────────────────────────────────
// Instructores
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_INSTRUCTORS: InstructorDto[] = [
  { trainer_Code: 'I001', trainer_Name: 'Roberto Castillo' },
  { trainer_Code: 'I002', trainer_Name: 'Elena Morales'    },
  { trainer_Code: 'I003', trainer_Name: 'Miguel Torres'    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Estructura raw para el timeline in-memory
// ─────────────────────────────────────────────────────────────────────────────

export interface MockWeekProgress {
  week:              number;
  level:             number;
  month:             number;
  base_Hours:        number;
  target_Efficiency: number;
  real_Efficiency:   number | null;
  real_Pieces:       number | null;
  base_Pieces:       number;
  status:            WeekStatus;
  instructorComment: string;
  weekState:         'added' | 'canceled' | 'moved' | 'requested' | 'none';
}

export interface MockAssignment {
  id:                   number;
  curve_Code:           string;
  curve_Version:        string;
  curve_Name:           string;
  area_AlphaNumId:      string;
  curveTypeCode:        string;
  curveTypeDescription: string;
  date_Assignment:      string;
  initialWeek:          number;
  duration:             number;
  statePeriod:          CurveStatus;
  comments:             string;
  weekProgress:         MockWeekProgress[];
}

export interface MockTimelineEmployee {
  employee_Code:     string;
  employee_Name:     string;
  employee_AltCode:  string;
  userCategory_Code: string;
  userCategory_Name: string;
  hasInstructor:     boolean;
  trainer_Code:      string;
  trainer_Name:      string;
  canBeAssigned:     boolean;
  assignments:       MockAssignment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: genera semanas con eficiencias reales
// ─────────────────────────────────────────────────────────────────────────────
function genWeeks(
  startWeek: number,
  count: number,
  level: number,
  baseHours: number,
  targets: number[],
  reals: (number | null)[],
  pieces: number[],
): MockWeekProgress[] {
  return Array.from({ length: count }, (_, i) => {
    const wk = startWeek + i;
    return {
      week:              wk,
      level,
      month:             Math.ceil(wk / 4),
      base_Hours:        baseHours,
      target_Efficiency: targets[i] ?? targets[targets.length - 1],
      real_Efficiency:   reals[i]   ?? null,
      real_Pieces:       reals[i] != null ? (pieces[i] ?? 100) : null,
      base_Pieces:       pieces[i] ?? 100,
      status:            (reals[i] != null ? 'completada' : 'por-hacer') as WeekStatus,
      instructorComment: '',
      weekState:         'none',
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos de empleados para 2026 S1 (semana actual = 25)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_TIMELINE_EMPLOYEES: MockTimelineEmployee[] = [

  // 1. ARNULFA OSORIO — sin instructor, sin asignaciones
  {
    employee_Code: 'E001', employee_Name: 'Arnulfa Osorio', employee_AltCode: 'A001',
    userCategory_Code: 'T', userCategory_Name: 'ENTRENAMIENTO',
    hasInstructor: false, trainer_Code: '', trainer_Name: '', canBeAssigned: false,
    assignments: [],
  },

  // 2. DENIA CHINCHILLA — sin instructor
  {
    employee_Code: 'E002', employee_Name: 'Denia Chinchilla', employee_AltCode: 'A002',
    userCategory_Code: 'T', userCategory_Name: 'ENTRENAMIENTO',
    hasInstructor: false, trainer_Code: '', trainer_Name: '', canBeAssigned: false,
    assignments: [],
  },

  // 3. FREDY FUNEZ — sin instructor
  {
    employee_Code: 'E003', employee_Name: 'Fredy Funez', employee_AltCode: 'A003',
    userCategory_Code: 'T', userCategory_Name: 'ENTRENAMIENTO',
    hasInstructor: false, trainer_Code: '', trainer_Name: '', canBeAssigned: false,
    assignments: [],
  },

  // 4. LUIS GALEANO — asignación RT semanas 17-26 (en-proceso)
  {
    employee_Code: 'E004', employee_Name: 'Luis Galeano', employee_AltCode: 'A004',
    userCategory_Code: 'RT', userCategory_Name: 'RE-ENTRENAMIENTO',
    hasInstructor: true, trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
    canBeAssigned: false,
    assignments: [{
      id: 101, curve_Code: 'C_ENSAMBLE_001', curve_Version: '1',
      curve_Name: 'Curva Básica Ensamble', area_AlphaNumId: 'ENSAMBLE 4',
      curveTypeCode: 'RT', curveTypeDescription: 'RE-ENTRENAMIENTO',
      date_Assignment: '2026-04-20', initialWeek: 17, duration: 10,
      statePeriod: 'en-proceso', comments: '',
      weekProgress: [
        ...genWeeks(17, 8, 1, 48,
          [27, 31, 35, 39, 43, 48, 52, 56],
          [25, 30, 33, 37, 40, 44, 50, 53],
          [220, 240, 260, 280, 300, 320, 340, 360]),
        { week:25, level:1, month:7, base_Hours:48, target_Efficiency:60, real_Efficiency:null,
          real_Pieces:null, base_Pieces:380, status:'en-progreso' as WeekStatus,
          instructorComment:'Continúa mejorando.', weekState:'none' },
        { week:26, level:1, month:7, base_Hours:48, target_Efficiency:65, real_Efficiency:null,
          real_Pieces:null, base_Pieces:400, status:'por-hacer' as WeekStatus,
          instructorComment:'', weekState:'none' },
      ],
    }],
  },

  // 5. WENDY GONZALES — dos asignaciones RT
  {
    employee_Code: 'E005', employee_Name: 'Wendy Gonzales', employee_AltCode: 'A005',
    userCategory_Code: 'RT', userCategory_Name: 'RE-ENTRENAMIENTO',
    hasInstructor: true, trainer_Code: 'I002', trainer_Name: 'Elena Morales',
    canBeAssigned: false,
    assignments: [
      // Asignación 1: semanas 5-12 (completada)
      {
        id: 201, curve_Code: 'C_ENSAMBLE_001', curve_Version: '1',
        curve_Name: 'Curva Básica Ensamble', area_AlphaNumId: 'DELANTEROS 1',
        curveTypeCode: 'RT', curveTypeDescription: 'RE-ENTRENAMIENTO',
        date_Assignment: '2026-01-26', initialWeek: 5, duration: 8,
        statePeriod: 'completada', comments: 'Primera curva completada.',
        weekProgress: genWeeks(5, 8, 1, 48,
          [30, 35, 40, 45, 50, 56, 62, 68],
          [28, 33, 38, 42, 47, 53, 60, 66],
          [180, 200, 220, 240, 260, 280, 300, 320]),
      },
      // Asignación 2: semanas 18-26 (en-proceso)
      {
        id: 202, curve_Code: 'C_ENSAMBLE_002', curve_Version: '1',
        curve_Name: 'Curva Avanzada Ensamble', area_AlphaNumId: 'DELANTEROS 1',
        curveTypeCode: 'RT', curveTypeDescription: 'RE-ENTRENAMIENTO',
        date_Assignment: '2026-04-27', initialWeek: 18, duration: 9,
        statePeriod: 'en-proceso', comments: '',
        weekProgress: [
          ...genWeeks(18, 7, 1, 48,
            [38, 41, 44, 47, 50, 54, 58],
            [36, 39, 42, 45, 48, 51, 55],
            [260, 270, 280, 290, 300, 310, 320]),
          { week:25, level:1, month:7, base_Hours:48, target_Efficiency:62, real_Efficiency:null,
            real_Pieces:null, base_Pieces:340, status:'en-progreso' as WeekStatus,
            instructorComment:'Buen ritmo.', weekState:'none' },
          { week:26, level:1, month:7, base_Hours:48, target_Efficiency:66, real_Efficiency:null,
            real_Pieces:null, base_Pieces:360, status:'por-hacer' as WeekStatus,
            instructorComment:'', weekState:'none' },
        ],
      },
    ],
  },

  // 6. SUYAPA MADRID — sin instructor
  {
    employee_Code: 'E006', employee_Name: 'Suyapa Madrid', employee_AltCode: 'A006',
    userCategory_Code: 'T', userCategory_Name: 'ENTRENAMIENTO',
    hasInstructor: false, trainer_Code: '', trainer_Name: '', canBeAssigned: false,
    assignments: [],
  },

  // 7. DENIS CRUZ — asignación RT semanas 22-26 (en-proceso)
  {
    employee_Code: 'E007', employee_Name: 'Denis Cruz', employee_AltCode: 'A007',
    userCategory_Code: 'RT', userCategory_Name: 'RE-ENTRENAMIENTO',
    hasInstructor: true, trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
    canBeAssigned: false,
    assignments: [{
      id: 301, curve_Code: 'C_ENSAMBLE_001', curve_Version: '1',
      curve_Name: 'Curva Básica Ensamble', area_AlphaNumId: 'ENSAMBLE 1',
      curveTypeCode: 'RT', curveTypeDescription: 'RE-ENTRENAMIENTO',
      date_Assignment: '2026-05-25', initialWeek: 22, duration: 5,
      statePeriod: 'en-proceso', comments: '',
      weekProgress: [
        { week:22, level:1, month:6, base_Hours:48, target_Efficiency:17, real_Efficiency:17,
          real_Pieces:120, base_Pieces:140, status:'completada' as WeekStatus,
          instructorComment:'', weekState:'none' },
        { week:23, level:1, month:6, base_Hours:48, target_Efficiency:23, real_Efficiency:20,
          real_Pieces:145, base_Pieces:170, status:'completada' as WeekStatus,
          instructorComment:'Progreso normal.', weekState:'none' },
        { week:24, level:1, month:6, base_Hours:48, target_Efficiency:29, real_Efficiency:27,
          real_Pieces:175, base_Pieces:200, status:'completada' as WeekStatus,
          instructorComment:'', weekState:'none' },
        { week:25, level:1, month:7, base_Hours:48, target_Efficiency:35, real_Efficiency:null,
          real_Pieces:null, base_Pieces:220, status:'en-progreso' as WeekStatus,
          instructorComment:'Mejorar concentración.', weekState:'none' },
        { week:26, level:1, month:7, base_Hours:48, target_Efficiency:41, real_Efficiency:null,
          real_Pieces:null, base_Pieces:240, status:'por-hacer' as WeekStatus,
          instructorComment:'', weekState:'none' },
      ],
    }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock legacy — solo para el interceptor HTTP (dead code para curve-assignment)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_ASSIGNMENTS: EmployeeAssignmentDTO[] = [
  {
    codeId: 1, employee_Code: 'E004', employee_Name: 'Luis Galeano',
    curve_Code: 'C_ENSAMBLE_001', curve_Version: 1, area_AlphaNumId: 'ENSAMBLE 4',
    date_Assignment: '2026-04-20', statePeriod: 'en-proceso', curveTypeCode: 'RT',
    initialWeek: 17, finalWeek: 26, duration: 10, lvlStart: 1,
    trainer_Code: 'I001', trainer_Name: 'Roberto Castillo', weeks: [],
  },
];

export const MOCK_TRACKING: CurveTrackDto[] = [
  {
    employee_Code: 'E004', employee_Name: 'Luis Galeano',
    curve_Code: 'C_ENSAMBLE_001', assignment_Id: 101, codeId: 1009,
    assignment_Week: 25, curve_Level: 1,
    target_Efficiency: 60, real_Efficiency: null, real_Pieces: null,
    assignment_Progress: 'en-progreso', isCurrentWeek: true, trainer_Code: 'I001',
  },
  {
    employee_Code: 'E005', employee_Name: 'Wendy Gonzales',
    curve_Code: 'C_ENSAMBLE_002', assignment_Id: 202, codeId: 2009,
    assignment_Week: 25, curve_Level: 1,
    target_Efficiency: 62, real_Efficiency: null, real_Pieces: null,
    assignment_Progress: 'en-progreso', isCurrentWeek: true, trainer_Code: 'I002',
  },
  {
    employee_Code: 'E007', employee_Name: 'Denis Cruz',
    curve_Code: 'C_ENSAMBLE_001', assignment_Id: 301, codeId: 3004,
    assignment_Week: 25, curve_Level: 1,
    target_Efficiency: 35, real_Efficiency: null, real_Pieces: null,
    assignment_Progress: 'en-progreso', isCurrentWeek: true, trainer_Code: 'I001',
  },
];

export const MOCK_OPERATORS: UserTrainingDto[] = [
  { employee_Code: 'E004', employee_Name: 'Luis Galeano',   trainer_Code: 'I001', trainer_Name: 'Roberto Castillo', curve_Code: 'C_ENSAMBLE_001', status: 'en-proceso' },
  { employee_Code: 'E005', employee_Name: 'Wendy Gonzales', trainer_Code: 'I002', trainer_Name: 'Elena Morales',    curve_Code: 'C_ENSAMBLE_002', status: 'en-proceso' },
  { employee_Code: 'E007', employee_Name: 'Denis Cruz',     trainer_Code: 'I001', trainer_Name: 'Roberto Castillo', curve_Code: 'C_ENSAMBLE_001', status: 'en-proceso' },
];

export const MOCK_REQUESTS: CurveRequestDto[] = [
  {
    codeId: 1, assignmentDet_CodeId: 1009, employee_Code: 'E004', employee_Name: 'Luis Galeano',
    week_Number: 23, current_Status: 'completada', requested_Status: 'no-completado',
    request_Date: '2026-06-05', comments: 'Eficiencia registrada incorrectamente.',
    trainer_Code: 'I001', trainer_Name: 'Roberto Castillo',
  },
  {
    codeId: 2, assignmentDet_CodeId: 2007, employee_Code: 'E005', employee_Name: 'Wendy Gonzales',
    week_Number: 22, current_Status: 'en-progreso', requested_Status: 'en-pausa',
    request_Date: '2026-06-08', comments: 'Incapacidad médica durante la semana.',
    trainer_Code: 'I002', trainer_Name: 'Elena Morales',
  },
];

export const MOCK_CURVES: CurveDto[] = [];
