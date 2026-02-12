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

## Argo CD UI Note

Some environments restrict adding Helm parameters in the UI. This repo sets a default
`opentelemetry-collector.mode: daemonset` in `helm/otel-collector/values.yaml` so Application
creation succeeds without additional parameters. Gateway overrides set `mode: deployment`.

## Creating Apps In Argo CD (UI)

1. Open Argo CD and click **New App**.
2. Set:
   - **Application Name**: `otel-collector-daemon-dev` (or your naming standard)
   - **Project**: `default`
   - **Sync Policy**: `Automatic` (optional, but matches the ApplicationSets)
3. In **Source**:
   - **Repository URL**: your Git repo URL
   - **Revision**: `main`
   - **Path**: `helm/otel-collector`
4. In **Destination**:
   - **Cluster URL**: `https://kubernetes.default.svc`
   - **Namespace**: `observability-dev`
5. Click **Create**.

To create the gateway app, repeat the above and use a gateway values file override via
the ApplicationSet (recommended). If you must create it manually, use the same chart path
and ensure `opentelemetry-collector.mode` resolves to `deployment` via the gateway values file.
