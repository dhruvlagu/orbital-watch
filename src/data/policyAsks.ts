export type PolicyAskId =
  | "iadc_binding"
  | "asat_ban"
  | "adr_authority"
  | "global_5year"
  | "general";

export interface PolicyAsk {
  label: string;
  askSummary: string;
  repCanDo: string;
  supportingStat?: string;
}

export const policyAsks: Record<PolicyAskId, PolicyAsk> = {
  iadc_binding: {
    label: "Strengthen international debris guidelines",
    askSummary:
      "Push for voluntary IADC debris guidelines to become binding international commitments.",
    repCanDo:
      "direct the State Department and NASA, through oversight and appropriations, to advocate for binding IADC commitments at UN COPUOS",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 8,000 objects if adopted (ESA compliance modeling).",
  },
  asat_ban: {
    label: "Support the global ASAT test ban",
    askSummary:
      "Support extending the US's own 2022 commitment against destructive ASAT tests internationally.",
    repCanDo:
      "support congressional resolutions affirming the US's 2022 unilateral ASAT test pledge and encouraging other spacefaring nations to adopt the same commitment",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 5,000 objects (based on historical ASAT event analysis).",
  },
  adr_authority: {
    label: "Support an international debris removal authority",
    askSummary:
      "Support US funding and participation in a UN-backed active debris removal authority.",
    repCanDo:
      "support US funding and diplomatic participation in an international active debris removal authority, should one be established",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 15,000 objects (Liou et al. 2021).",
  },
  global_5year: {
    label: "Support US leadership on de-orbit standards",
    askSummary:
      "Support US diplomatic leadership encouraging other nations to adopt equivalent de-orbit timelines.",
    repCanDo:
      "support US diplomatic leadership — using strengthened domestic de-orbit rules as leverage to encourage other spacefaring nations to adopt comparable standards",
    supportingStat:
      "Closing this gap globally is modeled to reduce projected 2050 LEO debris by roughly 10,000 objects.",
  },
  general: {
    label: "I support stronger debris policy generally",
    askSummary:
      "No specific ask — a general statement of concern about orbital debris and support for continued US leadership on the issue.",
    repCanDo:
      "prioritize orbital debris mitigation as a growing issue affecting national infrastructure, from GPS to weather forecasting to communications",
  },
};
