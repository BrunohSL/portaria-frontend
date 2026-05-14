"use client";
import { ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";
import { NODE_REGISTRY, NODE_TYPE_KEYS, isAllowedInFlowType } from "@/lib/node-registry";
import type { NodeType } from "@/types/flow";

interface NodePaletteProps {
  flowType: string | undefined;
  onAddNode: (type: NodeType) => void;
}

export function NodePalette({ flowType, onAddNode }: NodePaletteProps) {
  const [expanded, setExpanded] = useState(false);
  const allowedTypes = NODE_TYPE_KEYS.filter((t) => isAllowedInFlowType(t, flowType));

  return (
    <div
      className="absolute top-3 left-3 z-20 bg-card border border-border rounded-lg overflow-hidden transition-all"
      style={{ width: expanded ? 220 : 36 }}
    >
      <div className="flex items-center justify-between border-b border-border" style={{ height: 36 }}>
        {expanded && <span className="text-[10px] uppercase tracking-wider text-muted-foreground pl-3">Nodes</span>}
        <button
          className="size-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Recolher" : "Expandir nodes"}
        >
          <ChevronLeft
            className="size-3.5 transition-transform"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)" }}
          />
        </button>
      </div>
      {expanded && (
        <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
          {allowedTypes.map((type) => {
            const def = NODE_REGISTRY[type];
            const isRootOnly = !!def.restrictedToFlowType?.length;
            return (
              <button
                key={type}
                onClick={() => onAddNode(type)}
                className="w-full flex items-center gap-2 p-2 rounded border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <span className="size-2 rounded-full shrink-0" style={{ background: def.color }} />
                <span className="text-[11px] font-medium flex-1 truncate">{def.label}</span>
                {isRootOnly && (
                  <span className="text-[8px] uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded px-1 py-px">root</span>
                )}
                <Plus className="size-3 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
