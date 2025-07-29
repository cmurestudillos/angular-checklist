import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// Importar modelos necesarios
import { AppSettings } from '../models/app-settings.model';
import { AppStats } from '../models/app-stats.model';
import { UserPreferences } from '../models/user-preferences.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'checklist_user_preferences';

  // Configuración por defecto
  private readonly defaultSettings: AppSettings = {
    theme: 'auto',
    compactMode: false,
    showCompleted: true,
    autoSave: true,
    confirmDeletes: true,
    animationsEnabled: true,
    soundEnabled: false,
    defaultView: 'list',
    taskSorting: 'manual',
  };

  // Estado reactivo
  private settingsSubject = new BehaviorSubject<AppSettings>(this.defaultSettings);
  private statsSubject = new BehaviorSubject<AppStats>(this.getEmptyStats());

  // Observables públicos
  public settings$ = this.settingsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadSettings();
    this.startStatsTracking();
  }

  // ===== GESTIÓN DE CONFIGURACIÓN =====

  /**
   * Obtiene la configuración actual
   */
  getSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  /**
   * Actualiza una configuración específica
   */
  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, [key]: value };

    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
    this.applySettings(newSettings);
  }

  /**
   * Actualiza múltiples configuraciones
   */
  updateSettings(partialSettings: Partial<AppSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...partialSettings };

    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
    this.applySettings(newSettings);
  }

  /**
   * Restaura configuración por defecto
   */
  resetToDefaults(): void {
    this.settingsSubject.next(this.defaultSettings);
    this.saveSettings(this.defaultSettings);
    this.applySettings(this.defaultSettings);
  }

  // ===== GESTIÓN DE ESTADÍSTICAS =====

  /**
   * Obtiene las estadísticas actuales
   */
  getStats(): AppStats {
    return this.statsSubject.value;
  }

  /**
   * Actualiza las estadísticas
   */
  updateStats(): void {
    const stats = this.calculateStats();
    this.statsSubject.next(stats);
    this.saveStats(stats);
  }

  /**
   * Registra actividad del usuario
   */
  trackActivity(): void {
    const currentStats = this.statsSubject.value;
    const updatedStats = {
      ...currentStats,
      ultimaActividad: new Date(),
      tiempoUsoTotal: currentStats.tiempoUsoTotal + 1,
    };

    this.statsSubject.next(updatedStats);
    this.saveStats(updatedStats);
  }

  // ===== MÉTODOS PRIVADOS =====

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const preferences: UserPreferences = JSON.parse(stored);
        const settings = { ...this.defaultSettings, ...preferences.settings };

        this.settingsSubject.next(settings);
        this.statsSubject.next(preferences.stats || this.getEmptyStats());
        this.applySettings(settings);
      }
    } catch (error) {
      console.warn('Error loading settings:', error);
    }
  }

  private saveSettings(settings: AppSettings): void {
    try {
      const currentPreferences = this.getCurrentPreferences();
      const preferences: UserPreferences = {
        ...currentPreferences,
        settings,
        lastUpdated: new Date(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Error saving settings:', error);
    }
  }

  private saveStats(stats: AppStats): void {
    try {
      const currentPreferences = this.getCurrentPreferences();
      const preferences: UserPreferences = {
        ...currentPreferences,
        stats,
        lastUpdated: new Date(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Error saving stats:', error);
    }
  }

  private getCurrentPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error reading current preferences:', error);
    }

    return {
      settings: this.defaultSettings,
      stats: this.getEmptyStats(),
      lastUpdated: new Date(),
    };
  }

  private applySettings(settings: AppSettings): void {
    // Aplicar tema
    this.applyTheme(settings.theme);

    // Aplicar modo compacto
    this.applyCompactMode(settings.compactMode);

    // Aplicar animaciones
    this.applyAnimations(settings.animationsEnabled);
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const body = document.body;

    // Remover clases de tema anteriores
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    if (theme === 'auto') {
      // Usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      body.classList.add('theme-auto');
    } else {
      body.classList.add(`theme-${theme}`);
    }
  }

  private applyCompactMode(compact: boolean): void {
    const body = document.body;
    if (compact) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }
  }

  private applyAnimations(enabled: boolean): void {
    const body = document.body;
    if (enabled) {
      body.classList.remove('no-animations');
    } else {
      body.classList.add('no-animations');
    }
  }

  private calculateStats(): AppStats {
    try {
      // Obtener datos del localStorage
      const totalListas = this.countListas();
      const { totalTareas, tareasCompletadas } = this.countTareas();
      const tareasActivas = totalTareas - tareasCompletadas;
      const completionRate = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;
      const listaConMasTareas = this.getListaWithMostTasks();

      return {
        totalListas,
        totalTareas,
        tareasCompletadas,
        tareasActivas,
        completionRate: Math.round(completionRate * 100) / 100,
        listaConMasTareas,
        ultimaActividad: new Date(),
        tiempoUsoTotal: this.statsSubject.value.tiempoUsoTotal || 0,
      };
    } catch (error) {
      console.warn('Error calculating stats:', error);
      return this.getEmptyStats();
    }
  }

  private countListas(): number {
    try {
      const metaData = localStorage.getItem('checklist_listas_meta');
      if (metaData) {
        const listas = JSON.parse(metaData);
        return Array.isArray(listas) ? listas.length : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private countTareas(): { totalTareas: number; tareasCompletadas: number } {
    let totalTareas = 0;
    let tareasCompletadas = 0;

    try {
      // Contar todas las tareas en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('checklist_lista_')) {
          const tareasData = localStorage.getItem(key);
          if (tareasData) {
            const tareas = JSON.parse(tareasData);
            if (Array.isArray(tareas)) {
              totalTareas += tareas.length;
              tareasCompletadas += tareas.filter(t => t.completed).length;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error counting tasks:', error);
    }

    return { totalTareas, tareasCompletadas };
  }

  private getListaWithMostTasks(): string | null {
    let maxTareas = 0;
    let listaConMasTareas: string | null = null;

    try {
      const metaData = localStorage.getItem('checklist_listas_meta');
      if (metaData) {
        const listas = JSON.parse(metaData);

        for (const lista of listas) {
          const tareasData = localStorage.getItem(`checklist_lista_${lista.id}`);
          if (tareasData) {
            const tareas = JSON.parse(tareasData);
            if (Array.isArray(tareas) && tareas.length > maxTareas) {
              maxTareas = tareas.length;
              listaConMasTareas = lista.title;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error finding lista with most tasks:', error);
    }

    return listaConMasTareas;
  }

  private getEmptyStats(): AppStats {
    return {
      totalListas: 0,
      totalTareas: 0,
      tareasCompletadas: 0,
      tareasActivas: 0,
      completionRate: 0,
      listaConMasTareas: null,
      ultimaActividad: null,
      tiempoUsoTotal: 0,
    };
  }

  private startStatsTracking(): void {
    // Actualizar estadísticas cada 30 segundos
    setInterval(() => {
      this.updateStats();
    }, 30000);

    // Actualizar estadísticas cuando cambie el localStorage
    window.addEventListener('storage', () => {
      this.updateStats();
    });

    // Actualizar estadísticas iniciales
    setTimeout(() => {
      this.updateStats();
    }, 1000);
  }

  // ===== MÉTODOS UTILITARIOS =====

  /**
   * Exporta la configuración actual
   */
  exportSettings(): string {
    const preferences = this.getCurrentPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Importa configuración desde JSON
   */
  importSettings(settingsJson: string): boolean {
    try {
      const preferences: UserPreferences = JSON.parse(settingsJson);

      if (preferences.settings) {
        const validSettings = { ...this.defaultSettings, ...preferences.settings };
        this.updateSettings(validSettings);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error importing settings:', error);
      return false;
    }
  }

  /**
   * Obtiene información del dispositivo para estadísticas
   */
  getDeviceInfo(): { platform: string; userAgent: string; screenSize: string } {
    return {
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent || 'Unknown',
      screenSize: `${screen.width}x${screen.height}`,
    };
  }
}
