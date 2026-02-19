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
                  `replace_pattern(body, "(?i)(\\"clientId\\"[[:space:]]*:[[:space:]]*\\")([^\\"]+)(\\")", "$1${replacement}$3") where resource.attributes["service.name"] == "${serviceName}" and IsString(body)`,
                  `replace_pattern(body, "(?i)(clientId[[:space:]]*[=:][[:space:]]*)([^,[:space:]]+)", "$1${replacement}") where resource.attributes["service.name"] == "${serviceName}" and IsString(body)`,
                ],
              },
            ],
          },
        },
      },
    },
  };
}
