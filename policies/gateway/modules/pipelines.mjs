export const pipelines = {
  devMinimal(extraLogProcessors = []) {
    return {
      opentelemetryCollector: {
        replicaCount: 1,
        config: {
          service: {
            pipelines: {
              traces: {
                processors: ["filter/traces_volume", "tail_sampling"],
              },
              logs: {
                processors: ["filter/logs_volume", ...extraLogProcessors],
              },
            },
          },
        },
      },
    };
  },

  baseline() {
    return {
      opentelemetryCollector: {
        config: {
          service: {
            pipelines: {
              traces: {
                processors: [
                  "filter/traces_volume",
                  "tail_sampling",
                  "redaction",
                  "memory_limiter",
                  "batch",
                ],
              },
              logs: {
                processors: [
                  "filter/logs_volume",
                  "transform/log_body_limit",
                  "redaction",
                  "memory_limiter",
                  "batch",
                ],
              },
            },
          },
        },
      },
    };
  },
};
