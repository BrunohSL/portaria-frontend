export type CallStatus = "queued" | "in_progress" | "completed" | "failed" | "transferred" | "abandoned";

export interface CallSession {
  id: string;
  condominium_id: string;
  flow_id?: string;
  twilio_call_sid?: string;
  caller_number: string;
  current_step_id?: string;
  status: CallStatus;
  collected_data: Record<string, unknown>;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  error_message?: string;
  flow?: { id: string; name: string; type: string };
  condominium?: { id: string; name: string };
  created_at: string;
}

export interface CallLog {
  id: string;
  call_session_id: string;
  condominium_id: string;
  event_type: string;
  step_id?: string;
  payload?: Record<string, unknown>;
  step?: { id: string; type: string; step_order: number };
  created_at: string;
}
