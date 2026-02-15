import { tailSampling } from "../modules/sampling.mjs";

export const rules = [
  {
    id: "SIT-SAMPLING-001",
    name: "SIT baseline sampling at 10%",
    owner: "platform-observability",
    purpose: "Reduce telemetry cost and noise in SIT.",
    signal: "traces",
    action: "sample",
    services: ["*"],
    namespaces: ["*"],
    fragment: tailSampling(10),
  },
];

export const fragments = rules.map((rule) => rule.fragment);
