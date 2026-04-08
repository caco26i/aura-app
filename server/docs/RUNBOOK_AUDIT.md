# Audit log operations (Aura API)

The API appends **JSON-lines** to `AUDIT_LOG_PATH` (default `./data/audit.log`). Treat the file as **append-only (WORM)** in production: do not truncate in place while the process holds the file open without rotation discipline.

## Retention and rotation

1. **logrotate (Linux)** — rotate by size or daily. **Recommended:** in `postrotate`, send **`kill -USR2 <pid>`** (or `kill -s USR2 1` in PID-1 containers) so the API **closes and reopens** `AUDIT_LOG_PATH` and continues appending to the new inode at the same path (same idea as nginx `USR1` for access logs). Use `copytruncate` only if you accept a small race window. Alternatives: rotate to timestamped files and **restart** the API on a schedule, or set `AUDIT_LOG_PATH` to a dated filename via deployment config. **Copy-paste starter:** [`examples/audit-logrotate.example.conf`](./examples/audit-logrotate.example.conf).
2. **SIGUSR2 caveats** — Implemented on **Unix** (Linux, macOS). **Windows:** Node does not use this signal for reopen; use **restart** or a new `AUDIT_LOG_PATH` per deploy. **Docker/Kubernetes:** target the **API container PID** (often 1); if multiple processes share a PID namespace, ensure the signal reaches the Node process running `aura-api`.
3. **Container / k8s** — mount a volume for `data/`; ship rotated files to object storage (S3/GCS) or a log agent sidecar that tails the file.
4. **Retention** — align with legal / safety policy (often 30–90 days minimum for incident review). Set **`rotate N`** (and any archive copies) so on-disk history plus uploaded rotations cover that window — e.g. daily rotation with **`rotate 90`** on the host, or shorter local retention if a log shipper writes to object storage with its own lifecycle. After **`logrotate`** drops the oldest local file, ensure cold storage or SIEM retention policy still meets review needs. Redact or avoid PII in new event types; coordinates in audit are already a sensitivity — restrict access to the log bucket.

## SIEM

Forward JSON-lines as NDJSON to your SIEM or store in searchable object storage. Key `type` values include `journey.created`, `sos.alert_created`, `journey.location_share`, `journey.im_safe`, `audit.rate_limited`, `audit.validation_failed`, `audit.journey_not_found`, `audit.journey_forbidden`.

## Readiness

`GET /ready` verifies the audit directory is writable. After rotation, ensure the new path remains writable so readiness probes stay green.
