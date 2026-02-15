# OpenTelemetry Collector Gateway Pipeline

The gateway collector runs as a deployment and receives telemetry from daemonset collectors, then forwards to New Relic.

## Pipeline Overview

Order matters: filter early, then transform and redact, then stabilize with memory limiter and batch.

Traces pipeline:
1. `filter/traces_volume`
2. `tail_sampling`
3. `redaction`
4. `memory_limiter`
5. `batch`
6. `otlp/newrelic`
7. `spanmetrics` connector output

Logs pipeline:
1. `filter/logs_volume`
2. `transform/log_body_limit`
3. `redaction`
4. `memory_limiter`
5. `batch`
6. `otlp/newrelic`

Metrics pipeline:
1. `otlp` receiver input
2. `spanmetrics` connector input
3. `memory_limiter`
4. `batch`
5. `otlp/newrelic`

## Shared And Environment Values

Gateway values are layered:

- Shared base: `helm/otel-collector/values/common/gateway.yaml`
- Environment override: `helm/otel-collector/values/<env>/gateway.yaml`

Use the shared file for generic controls and keep env files small (for example, sampling rate).

## What Is Enabled By Default

In `values/common/gateway.yaml`:

- Chatty log filtering for known infra containers.
- Large log body replacement to:
  `log message was too long and was blocked`
- Redaction by attribute key patterns (`blocked_key_patterns`).
- Redaction by value regex patterns (`blocked_values`).
- Tail sampling with an overridable baseline percentage.
- Span-to-metrics conversion via `spanmetrics` connector (for error-rate/volume dashboards).

## Feature Toggle Pattern

Use processor lists in pipelines as the toggle mechanism:

- Remove `redaction` from `service.pipelines.logs.processors` to disable sensitive-data masking.
- Remove `transform/log_body_limit` from `service.pipelines.logs.processors` to disable large-message replacement.

## Namespace Or Service Specific Overrides

Keep global defaults in shared values, then add targeted filters in an env file using OTTL on resource attributes, for example:

- `resource.attributes["k8s.namespace.name"] == "payments"`
- `resource.attributes["service.name"] == "order-service"`

Recommendation: start with global controls only, then add targeted rules for noisy outliers to avoid operational complexity.
