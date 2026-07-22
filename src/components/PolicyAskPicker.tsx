import { policyAsks, type PolicyAskId } from "../data/policyAsks";

export interface PolicyAskPickerProps {
  selectedId?: PolicyAskId | null;
  onSelectAsk: (askId: PolicyAskId) => void;
}

const askOrder: PolicyAskId[] = [
  "iadc_binding",
  "asat_ban",
  "adr_authority",
  "global_5year",
  "general",
];

export default function PolicyAskPicker({
  selectedId,
  onSelectAsk,
}: PolicyAskPickerProps) {
  return (
    <div className="policyAskPicker" role="radiogroup" aria-label="Select a policy reform to champion">
      {askOrder.map((id) => {
        const ask = policyAsks[id];
        const isSelected = selectedId === id;

        return (
          <div
            key={id}
            className={`card policyAskCard ${isSelected ? "is-selected" : ""}`}
            onClick={() => onSelectAsk(id)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectAsk(id);
              }
            }}
          >
            <div className="policyAskCard__header">
              <div className="policyAskCard__radio">
                {isSelected ? (
                  <span className="policyAskCard__radioDot" aria-hidden="true" />
                ) : null}
              </div>
              <h4 className="policyAskCard__label">{ask.label}</h4>
            </div>
            <p className="policyAskCard__summary">{ask.askSummary}</p>
            {ask.supportingStat ? (
              <div className="policyAskCard__stat">
                <span className="policyAskCard__statIcon">📈</span> {ask.supportingStat}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
