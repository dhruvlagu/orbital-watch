export type PolicyAskId =
  | "iadc_binding"
  | "asat_ban"
  | "adr_authority"
  | "global_5year"
  | "general";

export interface PolicyAsk {
  label: string;
  askSummary: string;
  opening: string;
  issueParagraph: string;
  repCanDo: string;
  supportingStat?: string;
  whyItMatters: string[];
}

export const policyAsks: Record<PolicyAskId, PolicyAsk> = {
  iadc_binding: {
    label: "Strengthen international debris guidelines",
    askSummary:
      "Help strengthen international commitments to prevent new orbital debris.",
    opening:
      "I’m writing as one of your constituents because I’m concerned about the growing orbital debris problem.",
    issueParagraph:
      "The United States should continue leading efforts to make international debris guidelines binding and more enforceable, so that satellite operators around the world follow shared rules for safe launch, maneuvering, and post-mission disposal.",
    repCanDo:
      "support bipartisan legislation, oversight, and appropriations that advance stronger international debris-prevention commitments",
    supportingStat:
      "Current orbital environment models suggest this could reduce the projected number of tracked objects in low Earth orbit by roughly 8,000 by 2050.",
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
    opening:
      "As a constituent, I hope you’ll continue supporting responsible U.S. leadership in space.",
    issueParagraph:
      "Destructive anti-satellite tests create thousands of long-lived fragments that can threaten operational satellites and increase the risk for all users of space.",
    repCanDo:
      "support bipartisan legislation and oversight that reinforce U.S. commitments and encourage responsible behavior in space",
    supportingStat:
      "Current modeling suggests ending destructive ASAT testing could avoid roughly 5,000 additional tracked debris fragments over the next few decades.",
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
    opening:
      "I’m reaching out because orbital debris is becoming an increasingly important issue for the long-term sustainability of space.",
    issueParagraph:
      "The most dangerous large debris objects should be removed from orbit before they cause a catastrophic collision that could generate tens of thousands of new fragments.",
    repCanDo:
      "support appropriations, research, and international cooperation for responsible active debris removal",
    supportingStat:
      "Current orbital environment forecasts suggest this could lower the projected number of tracked objects by roughly 15,000 by 2050.",
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
    opening:
      "I’m a constituent in your district, and I’m writing to ask for continued attention to responsible space policy.",
    issueParagraph:
      "Stronger U.S. support for international satellite de-orbit standards can help ensure operators dispose of hardware safely instead of leaving inactive satellites to drift as collision hazards.",
    repCanDo:
      "support legislation, oversight, and funding that help the United States lead on responsible satellite de-orbit standards",
    supportingStat:
      "Modeling indicates more consistent end-of-life disposal practices could reduce the projected number of tracked objects in low Earth orbit by roughly 10,000 by 2050.",
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
    opening:
      "I’m writing as one of your constituents because I’m concerned about the long-term sustainability of space.",
    issueParagraph:
      "Congress has an important role in keeping orbital debris mitigation visible through NASA funding, space policy oversight, and support for international cooperation.",
    repCanDo:
      "support legislation, oversight, and funding that keep orbital debris mitigation on the national agenda",
    supportingStat:
      "Current analysis suggests this kind of attention can help prevent thousands of additional tracked objects from crowding low Earth orbit over the coming decades.",
    whyItMatters: [
      "Helps reduce the risk of future orbital debris.",
      "Protects satellites used for GPS, communications, and weather forecasting.",
      "Supports long-term sustainability of Earth's orbital environment.",
    ],
  },
};
