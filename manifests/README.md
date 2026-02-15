# Kubernetes Manifests

This directory contains raw Kubernetes manifests that are not Helm charts.

## Argo CD ApplicationSets

ApplicationSets for OpenTelemetry Collector are in:

- `manifests/argocd/otel-collector-daemon-appset.yaml`
- `manifests/argocd/otel-collector-gateway-appset.yaml`

They deploy the Helm chart at `helm/otel-collector` and use environment values from:

- `helm/otel-collector/values/common/gateway.yaml` (gateway shared pipeline)
- `helm/otel-collector/values/<env>/daemon.yaml`
- `helm/otel-collector/values/<env>/gateway.yaml`

## Apply

```bash
kubectl apply -f manifests/argocd/otel-collector-daemon-appset.yaml
kubectl apply -f manifests/argocd/otel-collector-gateway-appset.yaml
```

## Verify

```bash
kubectl -n argocd get applicationsets
kubectl -n argocd get applications | grep otel-collector
```
