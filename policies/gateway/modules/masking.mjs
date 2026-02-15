export function maskLogAttributeForService(serviceName, attributeKey, replacement = "[REDACTED]") {
  const processorName = `transform/${serviceName}_${attributeKey}_mask`;

  return {
    opentelemetryCollector: {
      config: {
        processors: {
          [processorName]: {
            error_mode: "ignore",
            log_statements: [
              {
                context: "log",
                statements: [
                  `set(attributes["${attributeKey}"], "${replacement}") where resource.attributes["service.name"] == "${serviceName}" and attributes["${attributeKey}"] != nil`,
                ],
              },
            ],
          },
        },
      },
    },
  };
}

export function maskLogBodyClientIdForService(serviceName, replacement = "[REDACTED]") {
  const processorName = `transform/${serviceName}_clientId_body_mask`;

  return {
    opentelemetryCollector: {
      config: {
        processors: {
          [processorName]: {
            error_mode: "ignore",
            log_statements: [
              {
                context: "log",
                statements: [
                  `replace_pattern(log.body, "(?i)(\\"clientId\\"\\s*:\\s*\\")([^\\"]+)(\\")", "$1${replacement}$3") where resource.attributes["service.name"] == "${serviceName}" and IsString(log.body)`,
                  `replace_pattern(log.body, "(?i)(clientId\\s*[=:]\\s*)([^,\\s\\}\\]\\\"']+)", "$1${replacement}") where resource.attributes["service.name"] == "${serviceName}" and IsString(log.body)`,
                ],
              },
            ],
          },
        },
      },
    },
  };
}
