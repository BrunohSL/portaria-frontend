export type StepType = "GREETING" | "COLLECT_DATA" | "VALIDATE_RESIDENT" | "ASK_QUESTION" | "OPEN_GATE" | "TRANSFER_CALL" | "END_CALL";

export interface Flow {
  id: string;
  condominium_id: string;
  name: string;
  type: string;
  active: boolean;
  steps?: FlowStep[];
  created_at: string;
}

export interface FlowStep {
  id: string;
  flow_id: string;
  condominium_id: string;
  step_order: number;
  type: StepType;
  config: Record<string, unknown>;
  created_at: string;
}
