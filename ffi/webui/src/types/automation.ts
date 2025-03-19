export type ActionType = 'navigate' | 'click' | 'type';

export interface ActionStatus {
  type: 'success' | 'error';
  message: string;
}
