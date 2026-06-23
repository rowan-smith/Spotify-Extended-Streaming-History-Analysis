export type ViewMode = 'chart' | 'table';

export const ALL_VIEW_MODES: ViewMode[] = ['chart', 'table'];

export function defaultViewMode(compact: boolean): ViewMode {
  return compact ? 'table' : 'chart';
}
