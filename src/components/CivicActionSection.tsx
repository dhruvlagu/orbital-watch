import { useEffect, useId, useState } from "react";
import { policyAsks, type PolicyAskId } from "../data/policyAsks";
import {
  lookupRepresentative,
  type RepresentativeResult,
} from "../services/representativeLookup";
import PolicyAskPicker from "./PolicyAskPicker";

export interface CivicActionSectionProps {
  preSelectedAskId?: PolicyAskId | null;
}

const PERSONALIZATION_PLACEHOLDER_SUBSTRING = "[Add a sentence";

function trackGA4Event(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtagFn = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtagFn === "function") {
    gtagFn("event", eventName, params);
  }
  console.info(`[analytics] ${eventName}`, params);
}

export default function CivicActionSection({
  preSelectedAskId,
}: CivicActionSectionProps) {
  const [selectedAskId, setSelectedAskId] = useState<PolicyAskId | null>(
    preSelectedAskId || null
  );
  const [zip, setZip] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [repResult, setRepResult] = useState<RepresentativeResult | null>(null);
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);

  const zipInputId = useId();
  const userNameInputId = useId();
  const messageTextareaId = useId();

  // Keep selectedAskId in sync if preSelectedAskId changes (e.g. navigation with new ask)
  useEffect(() => {
    if (preSelectedAskId) {
      setSelectedAskId(preSelectedAskId);
    }
  }, [preSelectedAskId]);

  // Regenerate message template when repResult, selectedAskId, userName, or zip changes
  useEffect(() => {
    if (!repResult || !repResult.representativeName || !selectedAskId) return;

    const ask = policyAsks[selectedAskId];
    if (!ask) return;

    const repName = repResult.representativeName;
    const statText = ask.supportingStat ? `\n${ask.supportingStat}\n` : "";
    const nameFormatted = userName.trim() ? userName.trim() : "[Your name]";

    const generated = `Dear Representative ${repName},

I'm a constituent in your district writing about orbital debris policy. ${ask.askSummary} Specifically, I'd ask you to ${ask.repCanDo}.
${statText}
I'd appreciate knowing your office's position on this issue, or any related legislation or oversight efforts you're aware of.

[Add a sentence about why this matters to you personally — messages with a personal note are far more likely to be read as genuine by congressional staff than a form letter.]

Thank you for your time,
${nameFormatted}
${zip.trim()}`;

    setMessageText(generated);

    // GA4 Event 1: representative_contact_generated
    trackGA4Event("representative_contact_generated", {
      ask_id: selectedAskId,
    });
  }, [repResult, selectedAskId, userName, zip]);

  const handleSelectAsk = (id: PolicyAskId) => {
    setSelectedAskId(id);
    setLookupError(null);
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAskId) {
      setLookupError("Please select a policy reform to champion above.");
      return;
    }

    const cleanZip = zip.trim();
    if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
      setLookupError("Please enter a valid 5-digit US zip code.");
      return;
    }

    setLoading(true);
    setLookupError(null);
    setRepResult(null);

    try {
      const result = await lookupRepresentative(cleanZip);
      if (result.noMatch || !result.representativeName) {
        setLookupError(
          result.message ||
            "No House representative found for this zip code. Double-check your entry or visit house.gov."
        );
      } else {
        setRepResult(result);
      }
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : "Unable to look up representative. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if personalization nudge is required
  const hasPlaceholder = messageText.includes(
    PERSONALIZATION_PLACEHOLDER_SUBSTRING
  );

  const handleCopyMessage = () => {
    if (hasPlaceholder || !selectedAskId) return;

    navigator.clipboard.writeText(messageText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });

    // GA4 Event 2: representative_contact_sent
    trackGA4Event("representative_contact_sent", {
      ask_id: selectedAskId,
      action_type: "copy",
    });
  };

  const handleContextualActionClick = () => {
    if (hasPlaceholder || !selectedAskId) return;

    // GA4 Event 2: representative_contact_sent
    trackGA4Event("representative_contact_sent", {
      ask_id: selectedAskId,
      action_type: "external_link",
    });
  };


  return (
    <div id="contact-rep" className="civicActionSection container reveal-item">
      <div className="civicActionHeader">
        <div className="hero__label">CIVIC ACTION</div>
        <h2>Contact Your Representative</h2>
        <p className="civicActionSubtitle">
          Turn research into advocacy. Reach out to your US House representative to prioritize orbital debris policy.
        </p>
      </div>

      {/* STEP 1: Select Policy Ask */}
      <div className="civicStepBlock">
        <div className="civicStepTitle">
          <span className="stepBadge">Step 1</span>
          <h3>Choose a Policy Reform to Champion</h3>
        </div>
        <p className="civicStepDesc">
          Select the specific policy ask you want to advocate for, or choose a general support statement.
        </p>
        <PolicyAskPicker
          selectedId={selectedAskId}
          onSelectAsk={handleSelectAsk}
        />
      </div>

      {/* STEP 2: Zip Code & Rep Lookup */}
      {selectedAskId ? (
        <div className="civicStepBlock reveal-item is-visible">
          <div className="civicStepTitle">
            <span className="stepBadge">Step 2</span>
            <h3>Find Your Representative</h3>
          </div>
          <p className="civicStepDesc">
            Enter your 5-digit US zip code to resolve your district and House representative.
          </p>

          <form onSubmit={handleLookupSubmit} className="zipLookupForm">
            <div className="zipFormGroup">
              <label htmlFor={zipInputId} className="zipLabel">
                Zip Code:
              </label>
              <input
                id={zipInputId}
                type="text"
                className="zipInput"
                placeholder="e.g. 90210"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <div className="zipFormGroup">
              <label htmlFor={userNameInputId} className="zipLabel">
                Your Name (optional):
              </label>
              <input
                id={userNameInputId}
                type="text"
                className="zipInput"
                placeholder="e.g. Jane Smith"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary zipSubmitBtn"
              disabled={loading}
            >
              {loading ? "Searching..." : "Find Representative →"}
            </button>
          </form>

          {lookupError ? (
            <div className="civicErrorBanner" role="alert">
              ⚠️ {lookupError}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* STEP 3: Generated Message & Representative Contact Options */}
      {repResult && repResult.representativeName && selectedAskId ? (
        <div className="civicStepBlock repDashboardBlock reveal-item is-visible">
          <div className="civicStepTitle">
            <span className="stepBadge">Step 3</span>
            <h3>Your Personalized Message to Rep. {repResult.representativeName}</h3>
          </div>

          {/* Ambiguous match disclaimer */}
          {repResult.isAmbiguousMatch && repResult.matchProportion ? (
            <div className="districtDisclaimer">
              ℹ️ Based on your zip code&apos;s most likely district (~
              {Math.round(repResult.matchProportion * 100)}% match) — if this doesn&apos;t match your actual representative, you can look up your exact district at{" "}
              <a
                href="https://www.house.gov/representatives/find-your-representative"
                target="_blank"
                rel="noopener noreferrer"
              >
                house.gov/representatives/find-your-representative
              </a>
              .
            </div>
          ) : null}

          {/* Personalization Nudge Banner */}
          {hasPlaceholder ? (
            <div className="nudgeBanner" role="alert">
              <span className="nudgeIcon">✏️</span>
              <div className="nudgeText">
                <strong>Personalization Recommended:</strong> Consider adding a personal note before sending — congressional offices weight personalized messages more heavily than identical form letters.
              </div>
            </div>
          ) : null}

          {/* Editable Textarea */}
          <div className="messageTextareaWrapper">
            <label htmlFor={messageTextareaId} className="messageTextareaLabel">
              Generated Message (Edit as needed):
            </label>
            <textarea
              id={messageTextareaId}
              className="messageTextarea"
              rows={14}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="civicActionsRow">
            <button
              type="button"
              className="btn btn--secondary copyMsgBtn"
              onClick={handleCopyMessage}
              disabled={hasPlaceholder}
              title={
                hasPlaceholder
                  ? "Please edit or replace the personal note placeholder first"
                  : "Copy full text to clipboard"
              }
            >
              {copied ? "✓ Copied to Clipboard!" : "Copy Message"}
            </button>

            {/* Contextual Action Button Priority */}
            {repResult.contact?.contactForm ? (
              <div className="contextualBtnWrapper">
                <a
                  href={repResult.contact.contactForm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn--primary contextualBtn ${
                    hasPlaceholder ? "is-disabled" : ""
                  }`}
                  onClick={handleContextualActionClick}
                  aria-disabled={hasPlaceholder}
                >
                  Open Official Contact Form →
                </a>
                <span className="contextualNote">
                  Copy your message above, then paste it into the form that opens.
                </span>
              </div>
            ) : repResult.contact?.officialSite ? (
              <div className="contextualBtnWrapper">
                <a
                  href={repResult.contact.officialSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn--primary contextualBtn ${
                    hasPlaceholder ? "is-disabled" : ""
                  }`}
                  onClick={handleContextualActionClick}
                  aria-disabled={hasPlaceholder}
                >
                  Visit Official Website →
                </a>
                <span className="contextualNote">
                  This office doesn&apos;t have a direct online contact form — copy your message above, then look for a &apos;Contact&apos; link on their site.
                </span>
              </div>
            ) : (
              <div className="contextualBtnWrapper">
                <span className="contextualNote">
                  This office&apos;s contact info is available by phone or mail:
                </span>
              </div>
            )}
          </div>

          {/* Supplementary Contact Details */}
          <div className="supplementaryContactInfo">
            {repResult.contact?.phone ? (
              <div className="contactDetailItem">
                <strong>Phone:</strong> {repResult.contact.phone}
              </div>
            ) : null}
            {repResult.contact?.mailingAddress ? (
              <div className="contactDetailItem">
                <strong>Office Address:</strong> {repResult.contact.mailingAddress}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
