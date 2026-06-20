import { PayWebCalendarWeek } from 'app/core/interfaces/training-curves/training-curves.interface';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Retorna el lunes de la semana ISO `week` para el año `year`.
 * ISO 8601: la semana 1 contiene el primer jueves del año (o Jan 4).
 */
function isoWeekStart(year: number, week: number): Date {
  // Jan 4 siempre está en la semana ISO 1
  const jan4     = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;           // 1=lunes … 7=domingo
  const w1Monday  = new Date(jan4);
  w1Monday.setDate(jan4.getDate() - dayOfWeek + 1);

  const result = new Date(w1Monday);
  result.setDate(w1Monday.getDate() + (week - 1) * 7);
  return result;
}

/**
 * Genera el arreglo de semanas de calendario para el año y semestre dados.
 *
 * @param year      Año (ej. 2026)
 * @param semester  1 = semanas 1-26 | 2 = semanas 27-52 | 0 = año completo (1-52)
 */
export function generateCalendarWeeks(
  year: number,
  semester: 1 | 2 | 0,
): PayWebCalendarWeek[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startWeek = semester === 2 ? 27 : 1;
  const endWeek   = semester === 1 ? 26 : 52;

  const weeks: PayWebCalendarWeek[] = [];

  for (let w = startWeek; w <= endWeek; w++) {
    const init = isoWeekStart(year, w);
    const fin  = new Date(init);
    fin.setDate(init.getDate() + 6);

    const isCurrentWeek = today >= init && today <= fin;
    const isPastWeek    = !isCurrentWeek && fin < today;
    const isFutureWeek  = !isCurrentWeek && init > today;

    weeks.push({
      year,
      month:          init.getMonth() + 1,
      monthName:      MONTH_NAMES[init.getMonth()],
      weekNumber:     w,
      semesterNumber: semester === 0 ? (w <= 26 ? 1 : 2) : semester,
      initialDate:    new Date(init),
      finalDate:      new Date(fin),
      isCurrentWeek,
      isPastWeek,
      isFutureWeek,
    });
  }

  return weeks;
}

/**
 * Retorna el número de semana ISO de una fecha dada.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}
