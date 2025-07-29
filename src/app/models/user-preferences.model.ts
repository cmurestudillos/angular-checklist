import { AppSettings } from './app-settings.model';
import { AppStats } from './app-stats.model';

export interface UserPreferences {
  settings: AppSettings;
  stats: AppStats;
  lastUpdated: Date;
}
