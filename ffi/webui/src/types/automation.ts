export type ActionType = 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'evaluate';

export interface ActionStatus {
  type: 'success' | 'error';
  message: string;
}

export interface AutomationHistory {
  action: string;
  timestamp: number;
  success: boolean;
}
