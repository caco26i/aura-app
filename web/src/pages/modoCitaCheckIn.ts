/** Pure helpers for Modo Cita local check-in nudges (testable, no DOM). */

export function parseMeetingLocalMs(value: string): number | null {
  if (!value.trim()) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Whether a non-intrusive check-in nudge should show: future meeting, and the suggested
 * interval (capped by time remaining until the meeting) has elapsed since last ack.
 */
export function isEncuentroCheckInNudgeDue(
  now: number,
  meetingMs: number | null,
  lastAckMs: number | null,
  intervalMinutes: number,
): boolean {
  if (meetingMs === null || meetingMs <= now) return false;
  const ack = lastAckMs ?? now;
  if (ack >= meetingMs) return false;
  const intervalMs = intervalMinutes * 60_000;
  const spanToMeeting = meetingMs - ack;
  const stepMs = Math.min(intervalMs, spanToMeeting);
  if (stepMs <= 0) return false;
  const rawDeadline = ack + stepMs;
  /** When the next tick lands exactly on meeting start, include the last ms before it. */
  const effectiveDeadline =
    rawDeadline >= meetingMs ? Math.max(ack, meetingMs - 1) : rawDeadline;
  return now >= effectiveDeadline;
}
