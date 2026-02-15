import {
  maskLogAttributeForService,
  maskLogBodyClientIdForService,
} from "../modules/masking.mjs";
import { pipelines } from "../modules/pipelines.mjs";
import { tailSampling } from "../modules/sampling.mjs";

export const rules = [
  {
    id: "DEV-SAMPLING-001",
    name: "Dev baseline sampling at 60%",
    owner: "platform-observability",
    purpose: "Limit trace volume while preserving enough data for debugging.",
    signal: "traces",
    action: "sample",
    services: ["*"],
    namespaces: ["*"],
    fragment: tailSampling(60),
  },
  {
    id: "DEV-PIPELINE-001",
    name: "Dev minimal volume controls",
    owner: "platform-observability",
    purpose: "Keep only core volume-control processors in dev pipelines.",
    signal: "traces+logs",
    action: "filter",
    services: ["*"],
    namespaces: ["*"],
    fragment: pipelines.devMinimal([
      "transform/order-service_userEmail_mask",
      "transform/payment-service_clientId_body_mask",
    ]),
  },
  {
    id: "DEV-MASK-001",
    name: "Mask order-service userEmail in logs",
    owner: "platform-observability",
    purpose: "Prevent plain-text email exposure in dev logs for order-service.",
    signal: "logs",
    action: "mask",
    services: ["order-service"],
    namespaces: ["*"],
    fragment: maskLogAttributeForService("order-service", "userEmail"),
  },
  {
    id: "DEV-MASK-002",
    name: "Mask payment-service clientId in log body",
    owner: "platform-observability",
    purpose: "Remove clientId values in payment-service log messages in dev.",
    signal: "logs",
    action: "mask",
    services: ["payment-service"],
    namespaces: ["*"],
    fragment: maskLogBodyClientIdForService("payment-service"),
  },
];

export const fragments = rules.map((rule) => rule.fragment);
