/**
 * Calm, non-alarmist copy for API outcomes — aligned with design/launch UX guidance.
 * Technical `error` strings stay raw for telemetry; these are for `role="alert"` / status regions.
 */

export type ApiSurface = 'journey' | 'sos';

const JOURNEY_OFFLINE = "We couldn't reach Aura. Check your connection and try again.";
const SOS_OFFLINE =
  "We couldn't confirm your alert reached Aura. If you're in immediate danger, contact local emergency services. You can also check your connection and try again.";

const JOURNEY_RATE =
  'Aura is handling a lot of requests right now. Please wait a moment and try again.';
const SOS_RATE =
  "We couldn't send your alert just yet because Aura is limiting requests. If you're in immediate danger, contact local emergency services. Wait a moment, then try again.";

const ANOMALY_HINT =
  'We noticed unusual activity on this network. Your request may still have gone through — if you are unsafe, contact local emergency services. You can try again in a moment or switch networks.';

const ANOMALY_SUCCESS_SOS =
  'Your alert was recorded. If you still feel unsafe, contact local emergency services.';

function isOfflineError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const m = e.message.toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('network request failed')
  );
}

function jsonErrorCode(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const err = (json as { error?: unknown }).error;
  return typeof err === 'string' ? err : undefined;
}

/** Map server `error` codes (when status is already categorized). */
function messageForJsonError(code: string | undefined, surface: ApiSurface): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case 'unauthorized':
      return 'Your session may have expired. When sign-in is available, sign in again and retry.';
    case 'forbidden':
      return "This action isn't available with your current access. If it keeps happening, contact your organizer.";
    case 'rate_limited':
      return surface === 'sos' ? SOS_RATE : JOURNEY_RATE;
    case 'validation_failed':
    case 'invalid_journey_id':
      return 'Something in the request did not look right. Check your details and try again.';
    case 'not_found':
      return "We couldn't find that resource. Refresh the page or start again.";
    case 'server_misconfigured':
      return "Aura's live service isn't fully configured yet. Try again later or use demo mode without API keys.";
    default:
      return undefined;
  }
}

export function userMessageForHttpFailure(
  status: number,
  json: unknown,
  surface: ApiSurface,
): string {
  const code = jsonErrorCode(json);
  const byCode = messageForJsonError(code, surface);
  if (byCode) return byCode;

  if (status === 401) {
    return messageForJsonError('unauthorized', surface) ?? 'Your session may have expired. Sign in again when available.';
  }
  if (status === 403) {
    return (
      messageForJsonError('forbidden', surface) ??
      "This action isn't available right now. If it keeps happening, contact your organizer."
    );
  }
  if (status === 429) {
    return surface === 'sos' ? SOS_RATE : JOURNEY_RATE;
  }
  if (status >= 500) {
    return 'Something went wrong on our side. Please try again in a few minutes.';
  }
  if (status === 400) {
    return 'Something in the request did not look right. Check your details and try again.';
  }
  if (status === 404) {
    return (
      messageForJsonError('not_found', surface) ??
      "We couldn't find that resource. Refresh the page or start again."
    );
  }
  return userMessageForUnknownError(surface);
}

export function userMessageForNetworkFailure(surface: ApiSurface): string {
  return surface === 'sos' ? SOS_OFFLINE : JOURNEY_OFFLINE;
}

export function userMessageForMisconfiguration(): string {
  return 'Live backend is not connected (missing API URL or token in this build).';
}

export function noticeForAnomalyHeader(header: string | null): string | undefined {
  if (!header || !header.trim()) return undefined;
  const flags = header.split(',').map((s) => s.trim()).filter(Boolean);
  if (flags.includes('burst_sos')) {
    return ANOMALY_SUCCESS_SOS;
  }
  if (flags.includes('burst_location_share')) {
    return 'We noticed a lot of location updates in a short time. Sharing may still work — if something looks wrong, pause and try again in a few minutes.';
  }
  return ANOMALY_HINT;
}

export function userMessageForUnknownError(surface: ApiSurface): string {
  if (surface === 'sos') {
    return "We couldn't complete that request. If you're in immediate danger, contact local emergency services, then try again.";
  }
  return "We couldn't complete that request. Please try again.";
}

export { isOfflineError };
