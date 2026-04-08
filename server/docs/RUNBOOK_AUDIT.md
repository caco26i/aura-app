# Audit log operations (Aura API)

The API appends **JSON-lines** to `AUDIT_LOG_PATH` (default `./data/audit.log`). Treat the file as **append-only (WORM)** in production: do not truncate in place while the process holds the file open without rotation discipline.

## Retention and rotation

1. **logrotate (Linux)** — rotate by size or daily; use `copytruncate` only if you accept a small race window, or prefer **postrotate** sending `SIGUSR2` to a future log-reopen hook. Safer pattern: rotate to timestamped files and **restart** the API pod/process on a schedule so it opens a new path, or set `AUDIT_LOG_PATH` to a directory + dated filename via deployment config.
2. **Container / k8s** — mount a volume for `data/`; ship rotated files to object storage (S3/GCS) or a log agent sidecar that tails the file.
3. **Retention** — align with legal / safety policy (often 30–90 days minimum for incident review). Redact or avoid PII in new event types; coordinates in audit are already a sensitivity — restrict access to the log bucket.

## SIEM

Forward JSON-lines as NDJSON to your SIEM or store in searchable object storage. Key `type` values include `journey.created`, `sos.alert_created`, `journey.location_share`, `journey.im_safe`, `audit.rate_limited`, `audit.validation_failed`, `audit.journey_not_found`, `audit.journey_forbidden`.

## Readiness

`GET /ready` verifies the audit directory is writable. After rotation, ensure the new path remains writable so readiness probes stay green.
