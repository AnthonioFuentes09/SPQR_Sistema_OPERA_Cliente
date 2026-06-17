import {
  CurveDto,
  OperationsCategoriesDto,
  OperationsDto,
  BaseCurve_WeeksDto,
} from 'app/core/interfaces/training-config/training-config.interface';

// ── Categorías ───────────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: OperationsCategoriesDto[] = [
  { alphaNumId: 'ENSAMBLE',    name_Categ: 'Operaciones de Ensamble'       },
  { alphaNumId: 'EMPAQUE',     name_Categ: 'Operaciones de Empaque'        },
  { alphaNumId: 'PARTES-DEL',  name_Categ: 'Operaciones Partes Delanteras' },
  { alphaNumId: 'DESGASTE',    name_Categ: 'Operaciones de Desgaste'       },
  { alphaNumId: 'METALICO',    name_Categ: 'Operaciones Metálico'          },
  { alphaNumId: 'PRE-EMPAQUE', name_Categ: 'Operaciones Pre-Empaque'       },
];

// ── Operaciones por categoría ────────────────────────────────────────────────
export const MOCK_OPERATIONS: OperationsDto[] = [
  // ENSAMBLE
  { id: 1,  alphaNumId: 'E001', name_Oper: 'Ensamble de Cuerpo',     operationCategory_Name: 'ENSAMBLE'    },
  { id: 2,  alphaNumId: 'E002', name_Oper: 'Unión de Mangas',        operationCategory_Name: 'ENSAMBLE'    },
  { id: 3,  alphaNumId: 'E003', name_Oper: 'Ensamble de Cuello',     operationCategory_Name: 'ENSAMBLE'    },
  { id: 4,  alphaNumId: 'E004', name_Oper: 'Cierre de Costado',      operationCategory_Name: 'ENSAMBLE'    },
  { id: 5,  alphaNumId: 'E005', name_Oper: 'Pegado de Etiqueta',     operationCategory_Name: 'ENSAMBLE'    },

  // EMPAQUE
  { id: 6,  alphaNumId: 'P001', name_Oper: 'Doblez de Prendas',      operationCategory_Name: 'EMPAQUE'     },
  { id: 7,  alphaNumId: 'P002', name_Oper: 'Empaque en Bolsa',       operationCategory_Name: 'EMPAQUE'     },
  { id: 8,  alphaNumId: 'P003', name_Oper: 'Etiquetado de Precio',   operationCategory_Name: 'EMPAQUE'     },
  { id: 9,  alphaNumId: 'P004', name_Oper: 'Conteo de Unidades',     operationCategory_Name: 'EMPAQUE'     },
  { id: 10, alphaNumId: 'P005', name_Oper: 'Sellado de Caja',        operationCategory_Name: 'EMPAQUE'     },

  // PARTES-DEL
  { id: 11, alphaNumId: 'PD001', name_Oper: 'Bastas de Pantalón',    operationCategory_Name: 'PARTES-DEL'  },
  { id: 12, alphaNumId: 'PD002', name_Oper: 'Bolsas Traseras',       operationCategory_Name: 'PARTES-DEL'  },
  { id: 13, alphaNumId: 'PD003', name_Oper: 'Cierre Delantero',      operationCategory_Name: 'PARTES-DEL'  },
  { id: 14, alphaNumId: 'PD004', name_Oper: 'Pretina Interior',      operationCategory_Name: 'PARTES-DEL'  },

  // DESGASTE
  { id: 15, alphaNumId: 'D001', name_Oper: 'Lijado Manual',          operationCategory_Name: 'DESGASTE'    },
  { id: 16, alphaNumId: 'D002', name_Oper: 'Pistola de Aire',        operationCategory_Name: 'DESGASTE'    },
  { id: 17, alphaNumId: 'D003', name_Oper: 'Oxidado Químico',        operationCategory_Name: 'DESGASTE'    },
  { id: 18, alphaNumId: 'D004', name_Oper: 'Bigote Artesanal',       operationCategory_Name: 'DESGASTE'    },

  // METALICO
  { id: 19, alphaNumId: 'M001', name_Oper: 'Remache de Botón',       operationCategory_Name: 'METALICO'    },
  { id: 20, alphaNumId: 'M002', name_Oper: 'Colocación de Broche',   operationCategory_Name: 'METALICO'    },
  { id: 21, alphaNumId: 'M003', name_Oper: 'Fichero de Cadena',      operationCategory_Name: 'METALICO'    },
  { id: 22, alphaNumId: 'M004', name_Oper: 'Espiga de Gancho',       operationCategory_Name: 'METALICO'    },

  // PRE-EMPAQUE
  { id: 23, alphaNumId: 'PE001', name_Oper: 'Planchado Final',       operationCategory_Name: 'PRE-EMPAQUE' },
  { id: 24, alphaNumId: 'PE002', name_Oper: 'Revisión de Calidad',   operationCategory_Name: 'PRE-EMPAQUE' },
  { id: 25, alphaNumId: 'PE003', name_Oper: 'Corte de Hilos',        operationCategory_Name: 'PRE-EMPAQUE' },
  { id: 26, alphaNumId: 'PE004', name_Oper: 'Limpieza de Prenda',    operationCategory_Name: 'PRE-EMPAQUE' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildWeeks(count: number, startEff: number, endEff: number, hours = 44, pieces = 50): BaseCurve_WeeksDto[] {
  return Array.from({ length: count }, (_, i) => {
    const progress   = count > 1 ? i / (count - 1) : 1;
    const efficiency = Math.round(startEff + (endEff - startEff) * progress);
    const tolerance  = i < Math.floor(count / 2) ? 10 : 5;
    return {
      level:             i + 1,
      base_Hours:        hours,
      target_Efficiency: efficiency,
      canti_Pieces:      Math.round(pieces * (efficiency / 100)),
      tolerance,
      editableRow:       false,
      updatedRow:        false,
    };
  });
}

// ── Curvas pre-cargadas ───────────────────────────────────────────────────────
export const MOCK_CURVES: CurveDto[] = [
  {
    code:                 'C_ENSAMBLE_001',
    name_Curve:           'Curva Básica Ensamble',
    description:          'Entrenamiento inicial para operaciones de ensamble de cuerpo',
    catExenta_AlphaNumId: 'ENSAMBLE',
    selectedOperations:   ['E001'],
    selectedWeeks:        buildWeeks(8, 40, 90, 44, 120),
    canti_Semanas:        8,
    canti_Opers:          1,
    isActive:             true,
    cantiCurves:          '002',
  },
  {
    code:                 'C_ENSAMBLE_002',
    name_Curve:           'Curva Avanzada Ensamble',
    description:          'Nivel avanzado para unión de mangas y cuello',
    catExenta_AlphaNumId: 'ENSAMBLE',
    selectedOperations:   ['E002'],
    selectedWeeks:        buildWeeks(12, 50, 95, 44, 100),
    canti_Semanas:        12,
    canti_Opers:          1,
    isActive:             true,
    cantiCurves:          '002',
  },
  {
    code:                 'C_EMPAQUE_001',
    name_Curve:           'Curva Empaque General',
    description:          'Proceso estándar de empaque y doblez de prendas',
    catExenta_AlphaNumId: 'EMPAQUE',
    selectedOperations:   ['P001'],
    selectedWeeks:        buildWeeks(6, 55, 92, 44, 200),
    canti_Semanas:        6,
    canti_Opers:          1,
    isActive:             true,
    cantiCurves:          '001',
  },
  {
    code:                 'C_PARTES-DEL_001',
    name_Curve:           'Curva Partes Delanteras',
    description:          'Entrenamiento en costura de partes delanteras de pantalón',
    catExenta_AlphaNumId: 'PARTES-DEL',
    selectedOperations:   ['PD001'],
    selectedWeeks:        buildWeeks(10, 35, 88, 44, 80),
    canti_Semanas:        10,
    canti_Opers:          1,
    isActive:             true,
    cantiCurves:          '001',
  },
  {
    code:                 'C_DESGASTE_001',
    name_Curve:           'Curva Desgaste Básico',
    description:          'Técnicas básicas de desgaste manual y químico',
    catExenta_AlphaNumId: 'DESGASTE',
    selectedOperations:   ['D001'],
    selectedWeeks:        buildWeeks(8, 30, 80, 44, 60),
    canti_Semanas:        8,
    canti_Opers:          1,
    isActive:             false,
    cantiCurves:          '001',
  },
  {
    code:                 'C_METALICO_001',
    name_Curve:           'Curva Metálico Básico',
    description:          'Aplicación de botones, broches y accesorios metálicos',
    catExenta_AlphaNumId: 'METALICO',
    selectedOperations:   ['M001'],
    selectedWeeks:        buildWeeks(6, 45, 90, 44, 300),
    canti_Semanas:        6,
    canti_Opers:          1,
    isActive:             true,
    cantiCurves:          '001',
  },
];
