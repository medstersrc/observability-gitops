#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CHART_FILE="${REPO_ROOT}/helm/otel-collector/Chart.yaml"
VALUES_FILE="${REPO_ROOT}/helm/otel-collector/values.yaml"

if [[ ! -f "${CHART_FILE}" ]]; then
  echo "ERROR: Missing file: ${CHART_FILE}" >&2
  exit 1
fi

if [[ ! -f "${VALUES_FILE}" ]]; then
  echo "ERROR: Missing file: ${VALUES_FILE}" >&2
  exit 1
fi

chart_version="$(
  awk '
    /^[[:space:]]*-[[:space:]]*name:[[:space:]]*opentelemetry-collector[[:space:]]*$/ { in_dep=1; next }
    in_dep && /^[[:space:]]*version:[[:space:]]*/ {
      gsub(/"/, "", $2)
      print $2
      exit
    }
  ' "${CHART_FILE}"
)"

values_tag="$(
  awk '
    /^opentelemetry-collector:[[:space:]]*$/ { in_root=1; next }
    in_root && /^[[:space:]]*image:[[:space:]]*$/ { in_image=1; next }
    in_image && /^[[:space:]]*tag:[[:space:]]*/ {
      gsub(/"/, "", $2)
      print $2
      exit
    }
  ' "${VALUES_FILE}"
)"

if [[ -z "${chart_version}" ]]; then
  echo "ERROR: Could not parse opentelemetry-collector dependency version from ${CHART_FILE}" >&2
  exit 1
fi

if [[ -z "${values_tag}" ]]; then
  echo "ERROR: Could not parse opentelemetry-collector.image.tag from ${VALUES_FILE}" >&2
  exit 1
fi

if [[ "${chart_version}" != "${values_tag}" ]]; then
  echo "ERROR: Version mismatch detected."
  echo "  Chart dependency version: ${chart_version}"
  echo "  Values image tag:        ${values_tag}"
  echo "Align them with: tools/update-otel-collector-version.sh ${chart_version}"
  exit 1
fi

echo "Collector versions aligned: ${chart_version}"
