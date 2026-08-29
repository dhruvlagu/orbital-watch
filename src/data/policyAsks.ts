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
  closingSentence: string;
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
      "The United States should continue leading efforts to make debris mitigation guidelines more than voluntary recommendations, so operators around the world follow consistent practices for safe launch, maneuvering, and post-mission disposal.",
    repCanDo:
      "support bipartisan legislation, oversight, and appropriations that advance stronger international debris-prevention commitments",
    supportingStat:
      "Analysis of orbital environment models suggests stronger international adherence to debris mitigation standards could reduce the projected number of tracked objects in low Earth orbit by roughly 8,000 by 2050.",
    closingSentence:
      "Please let me know whether you will support this effort.",
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
      "Stopping destructive anti-satellite tests is one of the clearest steps Congress can back to prevent avoidable debris from threatening operational satellites and the services they provide.",
    repCanDo:
      "support bipartisan oversight and legislation that reinforce U.S. leadership against destructive anti-satellite testing",
    supportingStat:
      "Models show that banning destructive ASAT tests could avoid roughly 5,000 new tracked debris fragments over the next few decades.",
    closingSentence:
      "Please let me know if you will support stronger oversight in this area.",
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
      "An international authority for active debris removal can coordinate safe, transparent removal of the largest collision hazards before they fragment into tens of thousands of additional pieces.",
    repCanDo:
      "support appropriations, research, and international cooperation for responsible active debris removal",
    supportingStat:
      "Forecasts indicate a sustained active debris removal effort could lower the projected number of tracked objects by roughly 15,000 by 2050.",
    closingSentence:
      "Please let me know whether you will support U.S. leadership on this issue.",
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
      "Stronger U.S. support for international satellite de-orbit standards can make it more likely inactive satellites are retired safely instead of being left to drift as future collision hazards.",
    repCanDo:
      "support legislation, oversight, and funding that encourage responsible satellite end-of-life disposal practices",
    supportingStat:
      "Industry and modeling studies suggest more consistent end-of-life disposal practices could reduce the projected number of tracked objects in low Earth orbit by roughly 10,000 by 2050.",
    closingSentence:
      "Please let me know whether you will support stronger end-of-life disposal practices.",
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
      "support legislation, oversight, and appropriations that keep orbital debris mitigation on the national agenda",
    supportingStat:
      "Debris mitigation policy can prevent thousands of new tracked objects by 2050.",
    closingSentence:
      "Please let me know whether you support keeping debris mitigation a continuing priority.",
    whyItMatters: [
      "Helps reduce the risk of future orbital debris.",
      "Protects satellites used for GPS, communications, and weather forecasting.",
      "Supports long-term sustainability of Earth's orbital environment.",
    ],
  },
};
