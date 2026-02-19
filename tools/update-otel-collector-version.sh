#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: tools/update-otel-collector-version.sh <collector-version>

Example:
  tools/update-otel-collector-version.sh 0.77.0
EOF
}

if [[ "${1:-}" == "" ]] || [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

VERSION="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CHART_FILE="${REPO_ROOT}/helm/otel-collector/Chart.yaml"
VALUES_FILE="${REPO_ROOT}/helm/otel-collector/values.yaml"
CHART_DIR="${REPO_ROOT}/helm/otel-collector"

if [[ ! -f "${CHART_FILE}" ]]; then
  echo "ERROR: Missing file: ${CHART_FILE}" >&2
  exit 1
fi

if [[ ! -f "${VALUES_FILE}" ]]; then
  echo "ERROR: Missing file: ${VALUES_FILE}" >&2
  exit 1
fi

if ! command -v helm >/dev/null 2>&1; then
  echo "ERROR: helm is required but not found in PATH." >&2
  exit 1
fi

tmp_chart="$(mktemp)"
awk -v ver="${VERSION}" '
  /^[[:space:]]*dependencies:[[:space:]]*$/ { in_deps=1; print; next }
  in_deps && /^[[:space:]]*-[[:space:]]*name:[[:space:]]*opentelemetry-collector[[:space:]]*$/ {
    in_target_dep=1
    print
    next
  }
  in_target_dep && /^[[:space:]]*version:[[:space:]]*/ {
    sub(/version:[[:space:]]*.*/, "version: " ver)
    in_target_dep=0
    print
    next
  }
  { print }
' "${CHART_FILE}" > "${tmp_chart}"
mv "${tmp_chart}" "${CHART_FILE}"

tmp_values="$(mktemp)"
awk -v ver="${VERSION}" '
  /^opentelemetry-collector:[[:space:]]*$/ { in_root=1; print; next }
  in_root && /^[[:space:]]*image:[[:space:]]*$/ { in_image=1; print; next }
  in_image && /^[[:space:]]*tag:[[:space:]]*/ {
    sub(/tag:[[:space:]]*.*/, "tag: \"" ver "\"")
    in_image=0
    in_root=0
    print
    next
  }
  { print }
' "${VALUES_FILE}" > "${tmp_values}"
mv "${tmp_values}" "${VALUES_FILE}"

echo "Updated versions in:"
echo "  - ${CHART_FILE}"
echo "  - ${VALUES_FILE}"
echo
echo "Running: helm dependency update ${CHART_DIR}"
helm dependency update "${CHART_DIR}"
echo "Done."
