export function getTimeLeft(deadlineAt, now = Date.now()) {
  if (!deadlineAt) {
    return 0;
  }

  return Math.max(0, deadlineAt - now);
}

export function formatSeconds(milliseconds) {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

export function formatClock(milliseconds) {
  const totalSeconds = formatSeconds(milliseconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
