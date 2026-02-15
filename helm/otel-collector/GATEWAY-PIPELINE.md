# OpenTelemetry Collector Gateway Pipeline

The **gateway** collector runs as a deployment and receives telemetry from the **daemonset** collectors, then forwards to New Relic. This document describes the gateway pipeline and how to control volume, log size, and sensitive data.

## Architecture

- **Daemonset**: One collector per node; receives OTLP from workloads and forwards to the gateway.
- **Gateway**: Single (or few) replicas; applies filters, sampling, redaction, and exports to New Relic.

Pipeline order matters: filter early to reduce load, then transform/redact, then batch and export.

---

## Traces Pipeline

1. **filter/traces_volume** – Drops spans to limit volume to New Relic:
   - **Actuator traces**: Spans for `/actuator/*` (health, info, metrics, etc.) are dropped so they do not count against quotas or add noise.
   - Implemented with OTTL: any span whose `http.url`, `url.full`, or `span.name` matches `.*actuator.*` is dropped.
   - To drop more (e.g. readiness probes): add conditions like `attributes["http.target"] == "/readyz"`.

2. **tail_sampling** (optional, e.g. dev) – Keeps all errors and a percentage of baseline traces.

3. **redaction** – Masks sensitive span attributes (see [Redaction](#redaction)).

4. **memory_limiter** → **batch** – Standard stabilisation before export.

---

## Logs Pipeline

1. **filter/logs_volume** – Restricts to application logs:
   - Drops log records that match infra/sidecar sources (e.g. `istio-proxy`, `linkerd-proxy`).
   - Customise per environment by adding or changing OTTL conditions on `resource.attributes` or `body`.

2. **transform/log_body_limit** – Enforces a maximum log body size:
   - If the log body (string) is longer than the limit (e.g. 8192 bytes), the body is **replaced** with the fixed message:  
     `"log message too long was blocked"`.
   - Prevents oversized payloads and keeps a clear audit message. Limit is in the OTTL expression (e.g. `Len(log.body) > 8192`); change that number in your override to tune.

3. **redaction** – Masks sensitive log attributes and values (see [Redaction](#redaction)).

4. **memory_limiter** → **batch** – Then export.

---

## Redaction

The **redaction** processor is used for both traces and logs.

- **Attribute names (blocked_key_patterns)**  
  Any attribute whose name matches one of the regexes is redacted (value replaced with a fixed mask, e.g. `****`).  
  Examples: `.*password.*`, `.*secret.*`, `.*token.*`, `.*api_key.*`, `.*authorization.*`, `.*cookie.*`.

- **Attribute values (blocked_values)**  
  Values matching these regexes are masked even if the key is allowed.  
  Examples: SSN, credit card patterns, email (optional). Use `allowed_values` to whitelist safe values that would otherwise match.

- **allow_all_keys**  
  If `true`, all attribute keys are allowed and only `blocked_key_patterns` and `blocked_values` apply. If `false`, only keys in `allowed_keys` are kept, then value blocking is applied.

- **summary**  
  `silent` in production; use `info` or `debug` when tuning.

To add more patterns, extend `blocked_key_patterns` and `blocked_values` in your environment’s `gateway-values.yaml`.

---

## Metrics Pipeline

Metrics use only **memory_limiter** and **batch** in the gateway. Add a filter or transform here if you need to drop or modify metrics before New Relic.

---

## Per-Environment Overrides

Each environment has its own override file:

- `helm/overrides/<env>/gateway-values.yaml`

**Dev** (`dev/gateway-values.yaml`) includes:

- Actuator trace filtering  
- Log filter for sidecar/infra  
- Log body size limit (8KB) and replacement message  
- Redaction with example patterns  
- Tail sampling for traces  

**SIT/UAT/Prod** can:

1. Reuse the same pipeline (copy the `config` from dev and adjust).
2. Change the log body limit by editing the number in the transform OTTL (e.g. `8192` → `4096`).
3. Add or remove filter conditions (e.g. more actuator paths, or different log drop rules).
4. Tighten or loosen redaction (e.g. more `blocked_key_patterns`, or use `allowed_keys` instead of `allow_all_keys`).
5. Enable or disable tail_sampling and adjust sampling percentage.

---

## Making Limits and Patterns Configurable

The gateway config is plain YAML under `config`. To change behaviour per environment:

- **Log body limit**: Edit the transform processor’s OTTL and change the numeric threshold (e.g. `8192`).
- **Actuator patterns**: Edit `filter/traces_volume` and add/remove OTTL conditions.
- **Log inclusion/exclusion**: Edit `filter/logs_volume` and add/remove `log_record` conditions.
- **Redaction**: Edit `redaction.blocked_key_patterns`, `redaction.blocked_values`, and optionally `allowed_keys` / `allow_all_keys`.

If you later move to a Helm chart that supports templating, you can replace these literals with values (e.g. `{{ .Values.gateway.logBodyMaxBytes }}`).
