export function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

export function getCurrentLocalDateTime() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}
