export type ViewMode = 'chart' | 'table' | 'grid';

export const ALL_VIEW_MODES: ViewMode[] = ['chart', 'table', 'grid'];

export function defaultViewMode(compact: boolean): ViewMode {
  return compact ? 'grid' : 'chart';
}
