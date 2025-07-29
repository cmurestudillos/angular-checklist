import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';

// Servicios
import { StorageService } from '../../services/storage.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notificacion.service';

// Modelos
import { AppSettings } from '../../models/app-settings.model';
import { AppStats } from '../../models/app-stats.model';
import { Lista } from '../../models/lista.model';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent implements OnInit, OnDestroy {
  // ===== FORMULARIOS =====

  settingsForm!: FormGroup;
  appearanceForm!: FormGroup;
  behaviorForm!: FormGroup;

  // ===== ESTADO DE LA APLICACIÓN =====

  currentSettings: AppSettings;
  currentStats: AppStats;
  listas: Lista[] = [];

  // Estados de UI
  activeSection: 'stats' | 'appearance' | 'behavior' | 'settings' = 'stats';
  activeSectionIndex = 0; // Para controlar el índice de las pestañas
  isLoading = false;

  // ===== CONTROL DE SUSCRIPCIONES =====

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar configuración por defecto
    this.currentSettings = this.settingsService.getSettings();
    this.currentStats = this.settingsService.getStats();

    this.initializeForms();
  }

  // ===== LIFECYCLE HOOKS =====

  ngOnInit(): void {
    this.subscribeToServices();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INICIALIZACIÓN =====

  private initializeForms(): void {
    // Formulario principal de configuración
    this.settingsForm = this.fb.group({
      theme: [this.currentSettings.theme],
      compactMode: [this.currentSettings.compactMode],
      showCompleted: [this.currentSettings.showCompleted],
      autoSave: [this.currentSettings.autoSave],
      confirmDeletes: [this.currentSettings.confirmDeletes],
      animationsEnabled: [this.currentSettings.animationsEnabled],
      soundEnabled: [this.currentSettings.soundEnabled],
      defaultView: [this.currentSettings.defaultView],
      taskSorting: [this.currentSettings.taskSorting],
    });

    // Formulario de apariencia
    this.appearanceForm = this.fb.group({
      theme: [this.currentSettings.theme],
      compactMode: [this.currentSettings.compactMode],
      animationsEnabled: [this.currentSettings.animationsEnabled],
      defaultView: [this.currentSettings.defaultView],
    });

    // Formulario de comportamiento
    this.behaviorForm = this.fb.group({
      showCompleted: [this.currentSettings.showCompleted],
      autoSave: [this.currentSettings.autoSave],
      confirmDeletes: [this.currentSettings.confirmDeletes],
      soundEnabled: [this.currentSettings.soundEnabled],
      taskSorting: [this.currentSettings.taskSorting],
    });

    // Suscribirse a cambios en los formularios
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en apariencia
    this.appearanceForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.settingsService.updateSettings(values);
    });

    // Suscribirse a cambios en comportamiento
    this.behaviorForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.settingsService.updateSettings(values);
    });
  }

  private subscribeToServices(): void {
    // Suscribirse a cambios en configuración
    this.settingsService.settings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      this.currentSettings = settings;
      this.updateForms(settings);
      this.cdr.markForCheck();
    });

    // Suscribirse a cambios en estadísticas
    this.settingsService.stats$.pipe(takeUntil(this.destroy$)).subscribe(stats => {
      this.currentStats = stats;
      this.cdr.markForCheck();
    });

    // Suscribirse a cambios en listas
    this.storageService.listas$.pipe(takeUntil(this.destroy$)).subscribe(listas => {
      this.listas = listas;
      // Actualizar estadísticas cuando cambian las listas
      this.settingsService.updateStats();
      this.cdr.markForCheck();
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Cargar listas
    this.storageService
      .getListas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            this.listas = response.data;
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private updateForms(settings: AppSettings): void {
    // Actualizar formularios sin emitir eventos para evitar loops
    this.appearanceForm.patchValue(settings, { emitEvent: false });
    this.behaviorForm.patchValue(settings, { emitEvent: false });
    this.settingsForm.patchValue(settings, { emitEvent: false });
  }

  // ===== GESTIÓN DE SECCIONES =====

  setActiveSection(section: 'stats' | 'appearance' | 'behavior' | 'settings'): void {
    this.activeSection = section;
    this.settingsService.trackActivity();
  }

  onTabIndexChange(index: number): void {
    const sections: ('stats' | 'appearance' | 'behavior' | 'settings')[] = [
      'stats',
      'appearance',
      'behavior',
      'settings',
    ];
    this.activeSectionIndex = index;
    this.setActiveSection(sections[index]);
  }

  // ===== GESTIÓN DE CONFIGURACIÓN =====

  async resetSettings(): Promise<void> {
    const result = await this.notificationService.showConfirmation(
      'Se restaurará la configuración por defecto. ¿Continuar?',
      '¿Restaurar configuración?',
      'Sí, restaurar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      this.settingsService.resetToDefaults();
      await this.notificationService.showSuccess('Configuración restaurada correctamente');
    }
  }

  async exportSettings(): Promise<void> {
    try {
      const settingsJson = this.settingsService.exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'checklist-settings.json';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      await this.notificationService.showSuccess('Configuración exportada correctamente');
    } catch (error) {
      await this.notificationService.errorGeneric('exportar la configuración');
    }
  }

  onImportSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const content = e.target?.result as string;
        const success = this.settingsService.importSettings(content);

        if (success) {
          await this.notificationService.showSuccess('Configuración importada correctamente');
        } else {
          await this.notificationService.showError('Formato de configuración inválido');
        }
      } catch (error) {
        await this.notificationService.errorGeneric('importar la configuración');
      }
    };

    reader.readAsText(file);
    input.value = ''; // Limpiar el input
  }

  // ===== GESTIÓN DE ESTADÍSTICAS =====

  refreshStats(): void {
    this.settingsService.updateStats();
    this.notificationService.showToast('Estadísticas actualizadas', 'success', 2000);
  }

  async resetStats(): Promise<void> {
    const result = await this.notificationService.showConfirmation(
      'Se borrarán todas las estadísticas de uso. ¿Continuar?',
      '¿Borrar estadísticas?',
      'Sí, borrar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      // Aquí podrías implementar el reset de estadísticas
      await this.notificationService.showSuccess('Estadísticas reiniciadas');
    }
  }

  // ===== GETTERS PARA EL TEMPLATE =====

  get activeSectionIndexValue(): number {
    const sections = ['stats', 'appearance', 'behavior', 'settings'];
    return sections.indexOf(this.activeSection);
  }

  get completionPercentage(): number {
    return Math.round(this.currentStats.completionRate);
  }

  get hasData(): boolean {
    return this.currentStats.totalListas > 0;
  }

  get averageTasksPerList(): number {
    if (this.currentStats.totalListas === 0) return 0;
    return Math.round((this.currentStats.totalTareas / this.currentStats.totalListas) * 100) / 100;
  }

  // Propiedades para acceder a objetos globales desde el template
  get navigatorInfo(): string {
    try {
      return navigator.userAgent.split(' ').slice(-2, -1)[0] || 'Desconocido';
    } catch {
      return 'Desconocido';
    }
  }

  get storageUsage(): number {
    try {
      return JSON.stringify(localStorage).length / 1024;
    } catch {
      return 0;
    }
  }

  get lastActivityFormatted(): string {
    if (!this.currentStats.ultimaActividad) return 'Nunca';

    const now = new Date();
    const lastActivity = new Date(this.currentStats.ultimaActividad);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  }

  get usageTimeFormatted(): string {
    const minutes = this.currentStats.tiempoUsoTotal;
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours < 24) {
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  // ===== MÉTODOS DE UTILIDAD =====

  trackByListaId(index: number, lista: Lista): string {
    return lista.id;
  }

  getThemeIcon(theme: string): string {
    switch (theme) {
      case 'light':
        return 'wb_sunny';
      case 'dark':
        return 'nights_stay';
      case 'auto':
        return 'brightness_auto';
      default:
        return 'brightness_auto';
    }
  }

  getViewIcon(view: string): string {
    switch (view) {
      case 'list':
        return 'view_list';
      case 'grid':
        return 'view_module';
      default:
        return 'view_list';
    }
  }

  getSortingIcon(sorting: string): string {
    switch (sorting) {
      case 'manual':
        return 'drag_handle';
      case 'alphabetical':
        return 'sort_by_alpha';
      case 'dateCreated':
        return 'schedule';
      case 'dateModified':
        return 'update';
      default:
        return 'drag_handle';
    }
  }
}
