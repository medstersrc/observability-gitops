# Kubernetes Manifests

This directory contains raw Kubernetes manifests that are not Helm charts.

## Current Argo CD Layout

Environment-scoped ApplicationSet manifests now live under:

- `app/manifests/dev`
- `app/manifests/sit`
- `app/manifests/uat`
- `app/manifests/prod`

Each environment path contains:

- `otel-collector-daemon-appset.yaml`
- `otel-collector-gateway-appset.yaml`

Point one Argo CD bootstrap `Application` per environment to its folder.
Example: dev bootstrap app -> `app/manifests/dev`.

## Legacy Path

`manifests/argocd` is retained for compatibility during migration.
New deployments should use `app/manifests/<env>`.

## Verify

```bash
kubectl -n argocd get applicationsets
kubectl -n argocd get applications | grep otel-collector
```
