import { useState } from "react";
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
  const [mousePositions, setMousePositions] = useState<Record<string, { x: string; y: string }>>({});

  const handleMouseMove = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePositions(prev => ({
      ...prev,
      [id]: { x: `${x}%`, y: `${y}%` }
    }));
  };

  const handleMouseLeave = (id: string) => {
    setMousePositions(prev => ({
      ...prev,
      [id]: { x: '50%', y: '50%' }
    }));
  };

  return (
    <div className="policyAskPicker" role="radiogroup" aria-label="Select a policy reform to champion">
      {askOrder.map((id) => {
        const ask = policyAsks[id];
        const isSelected = selectedId === id;
        const isFullWidth = id === "general";
        const mousePos = mousePositions[id] || { x: '50%', y: '50%' };

        return (
          <div
            key={id}
            className={`policyAskCard ${isSelected ? "is-selected" : ""} ${isFullWidth ? "policyAskCard--full" : ""}`}
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
            onMouseMove={(e) => handleMouseMove(id, e)}
            onMouseLeave={() => handleMouseLeave(id)}
            style={{ ['--mouse-x' as any]: mousePos.x, ['--mouse-y' as any]: mousePos.y }}
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
                <span className="policyAskCard__statIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                </span>
                {ask.supportingStat}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
