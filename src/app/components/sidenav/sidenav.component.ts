import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';

import { ExportImportService } from '../../services/export-import.service';
import { StorageService } from '../../services/storage.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notificacion.service';

import { AppSettings } from '../../models/app-settings.model';
import { AppStats } from '../../models/app-stats.model';
import { Lista } from '../../models/lista.model';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
})
export class SidenavComponent implements OnInit, OnDestroy {
  @ViewChild('importDataInput') importDataInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private exportImportService = inject(ExportImportService);
  private settingsService = inject(SettingsService);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public settingsForm!: FormGroup;
  public appearanceForm!: FormGroup;
  public behaviorForm!: FormGroup;

  public currentSettings: AppSettings = this.settingsService.getSettings();
  public currentStats: AppStats = this.settingsService.getStats();
  public listas: Lista[] = [];

  public activeSection: 'stats' | 'appearance' | 'behavior' | 'settings' = 'stats';
  public activeSectionIndex = 0;
  public isLoading = false;

  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForms();
  }

  public ngOnInit(): void {
    this.subscribeToServices();
    this.loadInitialData();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public setActiveSection(section: 'stats' | 'appearance' | 'behavior' | 'settings'): void {
    this.activeSection = section;
    this.settingsService.trackActivity();
  }

  public onTabIndexChange(index: number): void {
    const sections: ('stats' | 'appearance' | 'behavior' | 'settings')[] = [
      'stats',
      'appearance',
      'behavior',
      'settings',
    ];
    this.activeSectionIndex = index;
    this.setActiveSection(sections[index]);
  }

  public async resetSettings(): Promise<void> {
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

  public exportData(): void {
    this.exportImportService.downloadData();
  }

  public triggerImportData(): void {
    this.importDataInput.nativeElement.click();
  }

  public onImportData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.exportImportService
      .processImportFile(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.exportImportService.showImportResults(response.data);
          } else {
            this.notificationService.showError(response.error ?? 'Error durante la importación');
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.errorGeneric('importar los datos');
          this.cdr.markForCheck();
        },
      });

    input.value = '';
  }

  public async exportSettings(): Promise<void> {
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
    } catch {
      await this.notificationService.errorGeneric('exportar la configuración');
    }
  }

  public onImportSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

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
      } catch {
        await this.notificationService.errorGeneric('importar la configuración');
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  public refreshStats(): void {
    this.settingsService.updateStats();
    this.notificationService.showToast('Estadísticas actualizadas', 'success', 2000);
  }

  public async resetStats(): Promise<void> {
    const result = await this.notificationService.showConfirmation(
      'Se borrarán todas las estadísticas de uso. ¿Continuar?',
      '¿Borrar estadísticas?',
      'Sí, borrar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      await this.notificationService.showSuccess('Estadísticas reiniciadas');
    }
  }

  public get activeSectionIndexValue(): number {
    const sections = ['stats', 'appearance', 'behavior', 'settings'];
    return sections.indexOf(this.activeSection);
  }

  public get completionPercentage(): number {
    return Math.round(this.currentStats.completionRate);
  }

  public get hasData(): boolean {
    return this.currentStats.totalListas > 0;
  }

  public get averageTasksPerList(): number {
    if (this.currentStats.totalListas === 0) {
      return 0;
    }
    return Math.round((this.currentStats.totalTareas / this.currentStats.totalListas) * 100) / 100;
  }

  public get navigatorInfo(): string {
    try {
      return navigator.userAgent.split(' ').slice(-2, -1)[0] || 'Desconocido';
    } catch {
      return 'Desconocido';
    }
  }

  public get storageUsage(): number {
    try {
      return JSON.stringify(localStorage).length / 1024;
    } catch {
      return 0;
    }
  }

  public get lastActivityFormatted(): string {
    if (!this.currentStats.ultimaActividad) {
      return 'Nunca';
    }

    const now = new Date();
    const lastActivity = new Date(this.currentStats.ultimaActividad);
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Ahora mismo';
    }
    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  }

  public get usageTimeFormatted(): string {
    const minutes = this.currentStats.tiempoUsoTotal;
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours < 24) {
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  public trackByListaId(index: number, lista: Lista): string {
    return lista.id;
  }

  public getThemeIcon(theme: string): string {
    switch (theme) {
      case 'light':
        return 'wb_sunny';
      case 'dark':
        return 'nights_stay';
      default:
        return 'brightness_auto';
    }
  }

  public getViewIcon(view: string): string {
    switch (view) {
      case 'list':
        return 'view_list';
      case 'grid':
        return 'view_module';
      default:
        return 'view_list';
    }
  }

  public getSortingIcon(sorting: string): string {
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

  private initializeForms(): void {
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

    this.appearanceForm = this.fb.group({
      theme: [this.currentSettings.theme],
      compactMode: [this.currentSettings.compactMode],
      animationsEnabled: [this.currentSettings.animationsEnabled],
      defaultView: [this.currentSettings.defaultView],
    });

    this.behaviorForm = this.fb.group({
      showCompleted: [this.currentSettings.showCompleted],
      autoSave: [this.currentSettings.autoSave],
      confirmDeletes: [this.currentSettings.confirmDeletes],
      soundEnabled: [this.currentSettings.soundEnabled],
      taskSorting: [this.currentSettings.taskSorting],
    });

    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    this.appearanceForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.settingsService.updateSettings(values);
    });

    this.behaviorForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
      this.settingsService.updateSettings(values);
    });
  }

  private subscribeToServices(): void {
    this.settingsService.settings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      this.currentSettings = settings;
      this.updateForms(settings);
      this.cdr.markForCheck();
    });

    this.settingsService.stats$.pipe(takeUntil(this.destroy$)).subscribe(stats => {
      this.currentStats = stats;
      this.cdr.markForCheck();
    });

    this.storageService.listas$.pipe(takeUntil(this.destroy$)).subscribe(listas => {
      this.listas = listas;
      this.settingsService.updateStats();
      this.cdr.markForCheck();
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

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
    this.appearanceForm.patchValue(settings, { emitEvent: false });
    this.behaviorForm.patchValue(settings, { emitEvent: false });
    this.settingsForm.patchValue(settings, { emitEvent: false });
  }
}
