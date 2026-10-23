export const getTodayString = (date = new Date(), timezone = 'UTC'): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: YYYY-MM-DD
  } catch (err) {
    return date.toISOString().split('T')[0];
  }
};

export const subtractDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().split('T')[0];
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

export const isDateBefore = (dateStrA: string, dateStrB: string): boolean => {
  return dateStrA < dateStrB;
};

export const isDateAfter = (dateStrA: string, dateStrB: string): boolean => {
  return dateStrA > dateStrB;
};
