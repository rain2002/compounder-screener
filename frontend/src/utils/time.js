export function formatLocalDateTime(value = new Date()) {
  return value.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
