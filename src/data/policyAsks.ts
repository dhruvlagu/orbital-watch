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
  whyItMatters: string[];
}

export const policyAsks: Record<PolicyAskId, PolicyAsk> = {
  iadc_binding: {
    label: "Strengthen international debris guidelines",
    askSummary:
      "Help strengthen international commitments to prevent new orbital debris.",
    repCanDo:
      "support legislation, oversight, and funding that advance stronger international debris-prevention commitments",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 8,000 objects if adopted (ESA compliance modeling).",
    whyItMatters: [
      "Helps prevent avoidable debris from entering orbit.",
      "Supports safer GPS, communications, and weather satellites.",
      "Encourages shared responsibility for a sustainable orbital environment.",
    ],
  },
  asat_ban: {
    label: "Support the global ASAT test ban",
    askSummary:
      "Build on the United States' commitment against destructive anti-satellite testing.",
    repCanDo:
      "support legislation and oversight that reinforce the United States' commitment and encourage responsible behavior in space",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 5,000 objects (based on historical ASAT event analysis).",
    whyItMatters: [
      "Destructive tests can create thousands of long-lived debris fragments.",
      "Protects satellites relied on for navigation and communications.",
      "Supports a safer, more stable orbital environment.",
    ],
  },
  adr_authority: {
    label: "Support an international debris removal authority",
    askSummary:
      "Support U.S. leadership in responsibly removing the most dangerous debris from orbit.",
    repCanDo:
      "support research, funding, and international cooperation for responsible active debris removal",
    supportingStat:
      "Modeled to reduce projected 2050 LEO debris by roughly 15,000 objects (Liou et al. 2021).",
    whyItMatters: [
      "Targets debris that poses the greatest collision risk.",
      "Protects the satellite services people use every day.",
      "Invests in a cleaner, more sustainable orbital future.",
    ],
  },
  global_5year: {
    label: "Support US leadership on de-orbit standards",
    askSummary:
      "Encourage responsible end-of-life practices for satellites around the world.",
    repCanDo:
      "support legislation, oversight, and funding that help the United States lead on responsible satellite de-orbit standards",
    supportingStat:
      "Closing this gap globally is modeled to reduce projected 2050 LEO debris by roughly 10,000 objects.",
    whyItMatters: [
      "Reduces the chance that inactive satellites become debris.",
      "Keeps crowded orbital paths safer for essential satellites.",
      "Promotes long-term stewardship of Earth's orbital environment.",
    ],
  },
  general: {
    label: "I support stronger debris policy generally",
    askSummary:
      "Make orbital debris a continuing priority for U.S. space policy.",
    repCanDo:
      "support legislation, oversight, and funding that keep orbital debris mitigation on the national agenda",
    whyItMatters: [
      "Helps reduce the risk of future orbital debris.",
      "Protects satellites used for GPS, communications, and weather forecasting.",
      "Supports long-term sustainability of Earth's orbital environment.",
    ],
  },
};
