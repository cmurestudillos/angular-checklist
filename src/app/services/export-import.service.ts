import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Servicios
import { StorageService } from './storage.service';
import { NotificationService } from './notificacion.service';
// Modelos
import { ExportData } from '../models/export-data.model';
import { ImportStats } from '../models/import-stats-model';
import { ListaCompleta } from '../models/lista-completa.model';
import { ServiceResponse } from '../types/service-response.type';

@Injectable({
  providedIn: 'root',
})
export class ExportImportService {
  private readonly EXPORT_VERSION = '2.0';
  private readonly ACCEPTED_FILE_TYPES = ['.json'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {}

  // ===== EXPORTACIÓN =====

  /**
   * Exporta todas las listas y tareas a un archivo JSON
   */
  exportData(): Observable<ServiceResponse<string>> {
    return this.storageService.getListas().pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          return of({
            success: false,
            error: 'No se pudieron obtener las listas',
            statusCode: 500,
          });
        }

        const listas = response.data;

        // Obtener todas las listas completas (con tareas)
        const listasCompletas$ = listas.map(lista =>
          this.storageService.getListaCompleta(lista.id).pipe(map(res => res.data))
        );

        return forkJoin(listasCompletas$).pipe(
          map(listasCompletas => {
            const listasValidas = listasCompletas.filter(lista => lista !== undefined) as ListaCompleta[];

            const exportData: ExportData = {
              version: this.EXPORT_VERSION,
              exportDate: new Date().toISOString(),
              listas: listasValidas,
              metadata: {
                totalListas: listasValidas.length,
                totalTareas: listasValidas.reduce((total, lista) => total + lista.tareas.length, 0),
              },
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            return {
              success: true,
              data: jsonString,
              statusCode: 200,
            };
          })
        );
      })
    );
  }

  /**
   * Descarga los datos como archivo JSON
   */
  downloadData(): void {
    this.exportData().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.downloadJsonFile(response.data, this.generateFileName());
          this.notificationService.showSuccess('Datos exportados correctamente');
        } else {
          this.notificationService.errorGeneric('exportar los datos');
        }
      },
      error: () => {
        this.notificationService.errorGeneric('exportar los datos');
      },
    });
  }

  private downloadJsonFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpiar la URL del objeto
    URL.revokeObjectURL(url);
  }

  private generateFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `checklist-backup-${dateStr}-${timeStr}.json`;
  }

  // ===== IMPORTACIÓN =====

  /**
   * Valida que el archivo sea válido antes de procesarlo
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo de archivo
    if (!this.ACCEPTED_FILE_TYPES.some(type => file.name.toLowerCase().endsWith(type))) {
      return {
        valid: false,
        error: `Tipo de archivo no válido. Se aceptan: ${this.ACCEPTED_FILE_TYPES.join(', ')}`,
      };
    }

    // Validar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es muy grande. Tamaño máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Procesa un archivo de importación
   */
  processImportFile(file: File): Observable<ServiceResponse<ImportStats>> {
    return new Observable(observer => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        observer.next({
          success: false,
          error: validation.error,
          statusCode: 400,
        });
        observer.complete();
        return;
      }

      const reader = new FileReader();

      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          this.importData(data).subscribe({
            next: result => observer.next(result),
            error: error => observer.error(error),
            complete: () => observer.complete(),
          });
        } catch (error) {
          observer.next({
            success: false,
            error: 'El archivo no tiene un formato JSON válido',
            statusCode: 400,
          });
          observer.complete();
        }
      };

      reader.onerror = () => {
        observer.next({
          success: false,
          error: 'Error al leer el archivo',
          statusCode: 500,
        });
        observer.complete();
      };

      reader.readAsText(file);
    });
  }

  /**
   * Importa los datos validando la estructura
   */
  private importData(data: any): Observable<ServiceResponse<ImportStats>> {
    return new Observable(observer => {
      // Validar estructura básica
      const validation = this.validateImportData(data);
      if (!validation.valid) {
        observer.next({
          success: false,
          error: validation.error,
          statusCode: 400,
        });
        observer.complete();
        return;
      }

      const importData = data as ExportData;
      const stats: ImportStats = {
        listasCreadas: 0,
        listasExistentes: 0,
        tareasImportadas: 0,
        errores: [],
      };

      // Procesar cada lista
      const importPromises = importData.listas.map(listaCompleta => this.importSingleLista(listaCompleta, stats));

      Promise.all(importPromises)
        .then(() => {
          observer.next({
            success: true,
            data: stats,
            statusCode: 200,
          });
          observer.complete();
        })
        .catch(error => {
          observer.next({
            success: false,
            error: 'Error durante la importación',
            statusCode: 500,
          });
          observer.complete();
        });
    });
  }

  private validateImportData(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Formato de datos inválido' };
    }

    if (!data.listas || !Array.isArray(data.listas)) {
      return { valid: false, error: 'No se encontraron listas válidas en el archivo' };
    }

    // Validar estructura de listas
    for (const lista of data.listas) {
      if (!lista.title || typeof lista.title !== 'string') {
        return { valid: false, error: 'Una o más listas tienen títulos inválidos' };
      }

      if (!lista.tareas || !Array.isArray(lista.tareas)) {
        return { valid: false, error: 'Una o más listas tienen estructura de tareas inválida' };
      }

      // Validar estructura de tareas
      for (const tarea of lista.tareas) {
        if (!tarea.tarea || typeof tarea.tarea !== 'string') {
          return { valid: false, error: 'Una o más tareas tienen texto inválido' };
        }
      }
    }

    return { valid: true };
  }

  private async importSingleLista(listaCompleta: ListaCompleta, stats: ImportStats): Promise<void> {
    try {
      // Intentar crear la lista
      const listaResponse = await this.storageService.crearLista(listaCompleta.title).toPromise();

      if (listaResponse?.success && listaResponse.data) {
        stats.listasCreadas++;

        // Importar tareas de esta lista
        for (const tarea of listaCompleta.tareas) {
          try {
            const tareaResponse = await this.storageService.crearTarea(listaResponse.data.id, tarea.tarea).toPromise();

            if (tareaResponse?.success) {
              stats.tareasImportadas++;
            }
          } catch (error) {
            stats.errores.push(`Error al importar tarea "${tarea.tarea}": ${error}`);
          }
        }
      } else {
        stats.listasExistentes++;
        stats.errores.push(`La lista "${listaCompleta.title}" ya existe y se omitió`);
      }
    } catch (error) {
      stats.errores.push(`Error al importar lista "${listaCompleta.title}": ${error}`);
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Muestra el resultado de la importación al usuario
   */
  showImportResults(stats: ImportStats): void {
    const messages = [];

    if (stats.listasCreadas > 0) {
      messages.push(`✅ ${stats.listasCreadas} listas creadas`);
    }

    if (stats.tareasImportadas > 0) {
      messages.push(`✅ ${stats.tareasImportadas} tareas importadas`);
    }

    if (stats.listasExistentes > 0) {
      messages.push(`⚠️ ${stats.listasExistentes} listas ya existían`);
    }

    if (stats.errores.length > 0) {
      messages.push(`❌ ${stats.errores.length} errores encontrados`);
    }

    const message = messages.length > 0 ? messages.join('\n') : 'No se importaron datos';

    if (stats.errores.length > 0) {
      this.notificationService.showWarning(
        message + '\n\nRevisa la consola para más detalles',
        'Importación completada con advertencias'
      );
      console.warn('Errores de importación:', stats.errores);
    } else if (stats.listasCreadas > 0 || stats.tareasImportadas > 0) {
      this.notificationService.showSuccess(message, 'Importación exitosa');
    } else {
      this.notificationService.showInfo('No se encontraron datos nuevos para importar');
    }
  }

  /**
   * Verifica si hay datos para exportar
   */
  hasDataToExport(): Observable<boolean> {
    return this.storageService
      .getListas()
      .pipe(map(response => (response.success && response.data ? response.data.length > 0 : false)));
  }
}
