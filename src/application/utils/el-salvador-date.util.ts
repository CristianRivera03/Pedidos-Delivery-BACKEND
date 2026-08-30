const EL_SALVADOR_TIME_ZONE = 'America/El_Salvador';
const EL_SALVADOR_UTC_OFFSET = '-06:00';

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EL_SALVADOR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function toElSalvadorIsoString(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date');
  }

  const parts = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${EL_SALVADOR_UTC_OFFSET}`;
}
