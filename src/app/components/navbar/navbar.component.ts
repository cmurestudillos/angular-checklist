import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ExportImportService } from '../../services/export-import.service';
import { NotificationService } from '../../services/notificacion.service';
import { PwaService } from '../../services/pwa.service';
import packageInfo from '../../../../package.json';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatProgressBarModule],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private exportImportService = inject(ExportImportService);
  private notificationService = inject(NotificationService);
  private pwaService = inject(PwaService);

  public readonly title = 'Check List';
  public appVersion: string = packageInfo.version;
  public isExporting = false;
  public isImporting = false;
  public hasDataToExport = false;

  public readonly canInstall = this.pwaService.canInstall;
  public readonly isInstalled = this.pwaService.isInstalled;

  @ViewChild('fileInput', { static: false })
  public fileInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  public ngOnInit(): void {
    this.checkDataAvailability();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public async onExportData(): Promise<void> {
    if (this.isExporting) {
      return;
    }

    if (!this.hasDataToExport) {
      await this.notificationService.showInfo('No hay listas creadas para exportar', 'Sin datos');
      return;
    }

    const result = await this.notificationService.showConfirmation(
      'Se descargará un archivo JSON con todas tus listas y tareas.',
      '¿Exportar datos?',
      'Sí, exportar',
      'Cancelar'
    );

    if (!result.isConfirmed) {
      return;
    }

    this.isExporting = true;
    this.notificationService.showLoading('Preparando exportación...');

    setTimeout(() => {
      this.exportImportService.downloadData();
      this.isExporting = false;
      this.notificationService.hideLoading();
    }, 1000);
  }

  public onImportClick(): void {
    if (this.isImporting) {
      return;
    }
    this.fileInput.nativeElement.click();
  }

  public async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    input.value = '';
    await this.processImportFile(file);
  }

  public async onInstallApp(): Promise<void> {
    await this.pwaService.install();
  }

  public onDesktopVersionClick(): void {
    this.notificationService.showInfo('La versión de escritorio estará disponible próximamente.', 'Próximamente');
  }

  public get exportButtonDisabled(): boolean {
    return this.isExporting || !this.hasDataToExport;
  }

  public get importButtonDisabled(): boolean {
    return this.isImporting;
  }

  public get exportButtonText(): string {
    if (this.isExporting) {
      return 'Exportando...';
    }
    if (!this.hasDataToExport) {
      return 'Sin datos para exportar';
    }
    return 'Exportar Listas';
  }

  public get importButtonText(): string {
    return this.isImporting ? 'Procesando...' : 'Importar Listas';
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

  private async processImportFile(file: File): Promise<void> {
    this.isImporting = true;
    this.notificationService.showLoading('Procesando archivo...');

    this.exportImportService
      .processImportFile(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          this.isImporting = false;
          this.notificationService.hideLoading();

          if (response.success && response.data) {
            this.exportImportService.showImportResults(response.data);
            this.checkDataAvailability();

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
  }
}
