import { tailSampling } from "../modules/sampling.mjs";

export const rules = [
  {
    id: "UAT-SAMPLING-001",
    name: "UAT baseline sampling at 10%",
    owner: "platform-observability",
    purpose: "Reduce telemetry cost and noise in UAT.",
    signal: "traces",
    action: "sample",
    services: ["*"],
    namespaces: ["*"],
    fragment: tailSampling(10),
  },
];

export const fragments = rules.map((rule) => rule.fragment);
