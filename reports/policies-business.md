# Gateway Policy Report (Business View)

Generated: stable

## DEV

### DEV-SAMPLING-001 - Dev baseline sampling at 60%

- Owner: platform-observability
- Purpose: Limit trace volume while preserving enough data for debugging.
- Signal: traces
- Action: sample
- Services: *
- Namespaces: *
- Sampling: 60%

### DEV-PIPELINE-001 - Dev minimal volume controls

- Owner: platform-observability
- Purpose: Keep only core volume-control processors in dev pipelines.
- Signal: traces+logs
- Action: filter
- Services: *
- Namespaces: *

### DEV-MASK-001 - Mask order-service userEmail in logs

- Owner: platform-observability
- Purpose: Prevent plain-text email exposure in dev logs for order-service.
- Signal: logs
- Action: mask
- Services: order-service
- Namespaces: *

### DEV-MASK-002 - Mask payment-service clientId in log body

- Owner: platform-observability
- Purpose: Remove clientId values in payment-service log messages in dev.
- Signal: logs
- Action: mask
- Services: payment-service
- Namespaces: *

## SIT

### SIT-SAMPLING-001 - SIT baseline sampling at 10%

- Owner: platform-observability
- Purpose: Reduce telemetry cost and noise in SIT.
- Signal: traces
- Action: sample
- Services: *
- Namespaces: *
- Sampling: 10%

## UAT

### UAT-SAMPLING-001 - UAT baseline sampling at 10%

- Owner: platform-observability
- Purpose: Reduce telemetry cost and noise in UAT.
- Signal: traces
- Action: sample
- Services: *
- Namespaces: *
- Sampling: 10%

## PROD

### PROD-SAMPLING-001 - Prod baseline sampling at 10%

- Owner: platform-observability
- Purpose: Control cost while preserving error traces and representative baseline.
- Signal: traces
- Action: sample
- Services: *
- Namespaces: *
- Sampling: 10%

### PROD-PIPELINE-001 - Prod volume controls and redaction enabled

- Owner: platform-observability
- Purpose: Apply volume filtering and sensitive-data redaction in production pipelines.
- Signal: traces+logs
- Action: filter+redact
- Services: *
- Namespaces: *

