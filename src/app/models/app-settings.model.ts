export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showCompleted: boolean;
  autoSave: boolean;
  confirmDeletes: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  defaultView: 'list' | 'grid';
  taskSorting: 'manual' | 'alphabetical' | 'dateCreated' | 'dateModified';
}
