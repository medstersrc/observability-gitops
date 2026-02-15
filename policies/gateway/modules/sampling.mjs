export function tailSampling(percent) {
  return {
    opentelemetryCollector: {
      config: {
        processors: {
          tail_sampling: {
            policies: [
              {
                name: "errors",
                type: "status_code",
                status_code: {
                  status_codes: ["ERROR"],
                },
              },
              {
                name: "baseline",
                type: "probabilistic",
                probabilistic: {
                  sampling_percentage: percent,
                },
              },
            ],
          },
        },
      },
    },
  };
}
