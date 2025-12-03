export interface ScheduleItem {
  id: string;
  startTime: string; // HH:mm format (24h)
  endTime: string | null;   // HH:mm format (24h)
  title: string;
  description?: string;
  type: 'presentation' | 'break' | 'workshop' | 'panel' | 'other';
}

export interface TimerState {
  currentItem: ScheduleItem | null;
  nextItem: ScheduleItem | null;
  timeRemainingMs: number;
  totalDurationMs: number;
  status: 'idle' | 'running' | 'overtime' | 'ended';
  progress: number; // 0 to 1
}

export enum ParsingStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
