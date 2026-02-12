# Observability GitOps (OpenTelemetry Collector)

This repository deploys the OpenTelemetry Collector to Kubernetes via Argo CD in two modes:

1. Daemonset (agent on each node)
2. Gateway (deployment)

Both modes use a single wrapper chart and different values overrides.

## Layout

- `helm/otel-collector`  
  Wrapper chart that depends on `opentelemetry-collector` and hosts shared defaults.
- `helm/apps`  
  Argo CD ApplicationSet manifests for daemon and gateway.
- `helm/overrides/<env>`  
  Environment overrides. Each mode has its own values file.

## Upgrade OpenTelemetry Collector Chart

When upgrading the upstream `opentelemetry-collector` chart:

1. Update `helm/otel-collector/Chart.yaml`:
   - Bump `dependencies[].version` to the new chart version.
2. Update `helm/otel-collector/values.yaml`:
   - Align `opentelemetry-collector.image.tag` to the desired collector version.
3. Refresh the vendored dependency:
   - Run `helm dependency update` to regenerate `Chart.lock` and `charts/opentelemetry-collector-<version>.tgz`.

### Commands (PowerShell)

```powershell
cd D:\workspace\playground\open-telemetry-poc\observability-gitops
helm dependency update .\helm\otel-collector
```

### Validate Render (Dev)

```powershell
helm template otel-collector-daemon .\helm\otel-collector -f .\helm\otel-collector\values.yaml -f .\helm\overrides\dev\daemon-values.yaml
helm template otel-collector-gateway .\helm\otel-collector -f .\helm\otel-collector\values.yaml -f .\helm\overrides\dev\gateway-values.yaml
```

### Things to Watch

1. Values schema changes in the new chart (fields renamed/removed).
2. Default ports or receiver configs that might change.
3. Breaking changes in the collector config format.
4. Image tag does not always match chart version; verify release notes.
