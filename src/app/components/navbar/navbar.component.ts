import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

// Servicios
import { ExportImportService } from '../../services/export-import.service';
import { NotificationService } from '../../services/notificacion.service';
import packageInfo from '../../../../package.json';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  // ===== PROPIEDADES PÚBLICAS =====

  readonly title = 'Check List';
  public appVersion: string = packageInfo.version;

  // Estado de carga
  isExporting = false;
  isImporting = false;
  hasDataToExport = false;

  // ===== REFERENCIAS A ELEMENTOS DEL DOM =====

  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  // ===== CONTROL DE SUSCRIPCIONES =====

  private destroy$ = new Subject<void>();

  constructor(
    private exportImportService: ExportImportService,
    private notificationService: NotificationService
  ) {
    this.loadAppVersion();
  }

  // ===== LIFECYCLE HOOKS =====

  ngOnInit(): void {
    this.checkDataAvailability();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PRIVADOS DE INICIALIZACIÓN =====

  private loadAppVersion(): void {
    try {
      // En un proyecto real, podrías importar package.json o tener esta info en un servicio
      // import packageInfo from '../../../../package.json';
      // this.appVersion = packageInfo.version;
      this.appVersion = '1.0.0'; // Fallback por ahora
    } catch (error) {
      console.warn('No se pudo cargar la versión de package.json');
      this.appVersion = '1.0.0';
    }
  }

  private checkDataAvailability(): void {
    this.exportImportService
      .hasDataToExport()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: hasData => {
          this.hasDataToExport = hasData;
        },
        error: () => {
          this.hasDataToExport = false;
        },
      });
  }

  // ===== GESTIÓN DE EXPORTACIÓN =====

  async onExportData(): Promise<void> {
    if (this.isExporting) return;

    // Verificar si hay datos para exportar
    if (!this.hasDataToExport) {
      await this.notificationService.showInfo('No hay listas creadas para exportar', 'Sin datos');
      return;
    }

    // Confirmar exportación
    const result = await this.notificationService.showConfirmation(
      'Se descargará un archivo JSON con todas tus listas y tareas.',
      '¿Exportar datos?',
      'Sí, exportar',
      'Cancelar'
    );

    if (!result.isConfirmed) return;

    this.isExporting = true;
    this.notificationService.showLoading('Preparando exportación...');

    try {
      // Pequeña pausa para mostrar el loading
      setTimeout(() => {
        this.exportImportService.downloadData();
        this.isExporting = false;
        this.notificationService.hideLoading();
      }, 1000);
    } catch (error) {
      this.isExporting = false;
      this.notificationService.hideLoading();
      await this.notificationService.errorGeneric('exportar los datos');
    }
  }

  // ===== GESTIÓN DE IMPORTACIÓN =====

  onImportClick(): void {
    if (this.isImporting) return;

    // Trigger del input file
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    input.value = '';

    await this.processImportFile(file);
  }

  private async processImportFile(file: File): Promise<void> {
    this.isImporting = true;
    this.notificationService.showLoading('Procesando archivo...');

    try {
      this.exportImportService
        .processImportFile(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            this.isImporting = false;
            this.notificationService.hideLoading();

            if (response.success && response.data) {
              this.exportImportService.showImportResults(response.data);

              // Actualizar el estado de disponibilidad de datos
              this.checkDataAvailability();

              // Si se importaron datos, recargar la página para reflejar cambios
              if (response.data.listasCreadas > 0) {
                const shouldReload = await this.notificationService.showConfirmation(
                  'Para ver las listas importadas correctamente, es recomendable recargar la página.',
                  '¿Recargar página?',
                  'Sí, recargar',
                  'Continuar sin recargar'
                );

                if (shouldReload.isConfirmed) {
                  window.location.reload();
                }
              }
            } else {
              await this.notificationService.showError(
                response.error || 'Error desconocido durante la importación',
                'Error de importación'
              );
            }
          },
          error: async () => {
            this.isImporting = false;
            this.notificationService.hideLoading();
            await this.notificationService.errorGeneric('procesar el archivo');
          },
        });
    } catch (error) {
      this.isImporting = false;
      this.notificationService.hideLoading();
      await this.notificationService.errorGeneric('procesar el archivo');
    }
  }

  // ===== GETTERS PARA EL TEMPLATE =====

  get exportButtonDisabled(): boolean {
    return this.isExporting || !this.hasDataToExport;
  }

  get importButtonDisabled(): boolean {
    return this.isImporting;
  }

  get exportButtonText(): string {
    if (this.isExporting) return 'Exportando...';
    if (!this.hasDataToExport) return 'Sin datos para exportar';
    return 'Exportar Listas';
  }

  get importButtonText(): string {
    return this.isImporting ? 'Procesando...' : 'Importar Listas';
  }

  // ===== MÉTODOS PARA FUTURE FEATURES =====

  onDesktopVersionClick(): void {
    this.notificationService.showInfo('La versión de escritorio estará disponible próximamente.', 'Próximamente');
  }
}
