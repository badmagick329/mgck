// Kept apart from @/lib/utils, which pulls in React toast state: the K-pop
// canonical-URL redirect imports this from Edge middleware.

/**
 * Take a YYMMDD, YYYYMMDD or YYYY-MM-DD string and return a YYYY-MM-DD string
 * or null if invalid.
 */
export function validDateStringOrNull(date: string) {
  date = date.trim();
  if (date.length !== 6 && date.length !== 8 && date.length !== 10) {
    return null;
  }
  if (date.length === 6) {
    date = `20${date}`;
  }

  if (date.length === 8) {
    date = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }

  if (isNaN(Date.parse(date))) {
    return null;
  }
  return date;
}
