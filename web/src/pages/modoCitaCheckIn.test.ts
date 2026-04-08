import { describe, expect, it } from 'vitest';
import { isEncuentroCheckInNudgeDue, parseMeetingLocalMs } from './modoCitaCheckIn';

describe('parseMeetingLocalMs', () => {
  it('returns null for empty', () => {
    expect(parseMeetingLocalMs('')).toBeNull();
    expect(parseMeetingLocalMs('   ')).toBeNull();
  });
});

describe('isEncuentroCheckInNudgeDue', () => {
  const meeting = 10_000;
  const intervalMin = 15;
  const intervalMs = intervalMin * 60_000;

  it('is false without a future meeting', () => {
    expect(isEncuentroCheckInNudgeDue(5000, null, 1000, intervalMin)).toBe(false);
    expect(isEncuentroCheckInNudgeDue(12_000, meeting, 1000, intervalMin)).toBe(false);
  });

  it('uses min(interval, time-to-meeting) for first nudge after ack', () => {
    const ack = 0;
    const step = Math.min(intervalMs, meeting - ack);
    const effective = step >= meeting - ack ? Math.max(ack, meeting - 1) : ack + step;
    expect(isEncuentroCheckInNudgeDue(effective - 1, meeting, ack, intervalMin)).toBe(false);
    expect(isEncuentroCheckInNudgeDue(effective, meeting, ack, intervalMin)).toBe(true);
  });

  it('treats null lastAck as now (not due immediately)', () => {
    const now = 50_000;
    expect(isEncuentroCheckInNudgeDue(now, meeting + intervalMs * 2, null, intervalMin)).toBe(false);
  });

  it('repeats after user ack advances baseline', () => {
    const ack1 = 0;
    const step1 = Math.min(intervalMs, meeting - ack1);
    const eff1 = step1 >= meeting - ack1 ? Math.max(ack1, meeting - 1) : ack1 + step1;
    expect(isEncuentroCheckInNudgeDue(eff1, meeting, ack1, intervalMin)).toBe(true);

    const ack2 = eff1;
    const step2 = Math.min(intervalMs, meeting - ack2);
    const eff2 = step2 >= meeting - ack2 ? Math.max(ack2, meeting - 1) : ack2 + step2;
    expect(isEncuentroCheckInNudgeDue(eff2 - 1, meeting, ack2, intervalMin)).toBe(false);
    expect(isEncuentroCheckInNudgeDue(eff2, meeting, ack2, intervalMin)).toBe(true);
  });
});
