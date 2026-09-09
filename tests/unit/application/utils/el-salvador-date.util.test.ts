import { toElSalvadorIsoString } from '@application/utils/el-salvador-date.util';

describe('toElSalvadorIsoString', () => {
  it('convierte UTC a la hora de El Salvador con milisegundos y desplazamiento', () => {
    const result = toElSalvadorIsoString(new Date('2026-08-25T18:30:00.123Z'));

    expect(result).toBe('2026-08-25T12:30:00.123-06:00');
  });

  it('maneja correctamente el cambio de año cerca de medianoche', () => {
    const result = toElSalvadorIsoString(new Date('2026-01-01T05:30:00.000Z'));

    expect(result).toBe('2025-12-31T23:30:00.000-06:00');
  });

  it('maneja correctamente el cambio de mes', () => {
    const result = toElSalvadorIsoString(new Date('2026-03-01T05:15:00.000Z'));

    expect(result).toBe('2026-02-28T23:15:00.000-06:00');
  });

  it('rechaza fechas inválidas', () => {
    expect(() => toElSalvadorIsoString(new Date('invalid'))).toThrow(
      new RangeError('Invalid date'),
    );
  });
});
