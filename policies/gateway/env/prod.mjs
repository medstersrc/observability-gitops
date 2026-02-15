import { pipelines } from "../modules/pipelines.mjs";
import { tailSampling } from "../modules/sampling.mjs";

export const rules = [
  {
    id: "PROD-SAMPLING-001",
    name: "Prod baseline sampling at 10%",
    owner: "platform-observability",
    purpose: "Control cost while preserving error traces and representative baseline.",
    signal: "traces",
    action: "sample",
    services: ["*"],
    namespaces: ["*"],
    fragment: tailSampling(10),
  },
  {
    id: "PROD-PIPELINE-001",
    name: "Prod volume controls and redaction enabled",
    owner: "platform-observability",
    purpose: "Apply volume filtering and sensitive-data redaction in production pipelines.",
    signal: "traces+logs",
    action: "filter+redact",
    services: ["*"],
    namespaces: ["*"],
    fragment: pipelines.baseline(),
  },
];

export const fragments = rules.map((rule) => rule.fragment);
