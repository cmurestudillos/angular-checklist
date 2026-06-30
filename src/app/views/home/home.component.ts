import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

// Servicios
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notificacion.service';

// Enums
import { StorageKeys } from '../../enums/storage-keys.enum';

// Modelos
import { DrawerState } from '../../models/drawer-state.model';
import { ListaCompleta } from '../../models/lista-completa.model';
import { Lista } from '../../models/lista.model';
import { SelectionState } from '../../models/selection-state.model';
import { Tarea } from '../../models/tarea.model';
import { TaskEditState } from '../../models/task-edit-state.model';

/**
 *
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  public listas: Lista[] = [];
  public listaActual: ListaCompleta | null = null;

  public nuevoTituloLista = '';
  public nuevoTextoTarea = '';

  public drawerState: DrawerState = { opened: false, mode: 'create' };
  public taskEditState: TaskEditState = { isEditing: false };
  public selectionState: SelectionState = { allSelected: false, hasSelected: false, selectedCount: 0 };

  private destroy$ = new Subject<void>();

  // ===== LIFECYCLE HOOKS =====

  /**
   *
   */
  public ngOnInit(): void {
    this.loadListas();
    this.subscribeToListasChanges();
  }

  /**
   *
   */
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== GESTIÓN DE LISTAS =====

  /**
   *
   */
  public abrirFormularioNuevaLista(): void {
    this.drawerState = { opened: true, mode: 'create' };
    this.nuevoTituloLista = '';
    this.listaActual = null;
    this.cdr.markForCheck();

    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="nombre de la lista"]') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  /**
   *
   * @param lista
   */
  public abrirFormularioEditarLista(lista: Lista): void {
    this.drawerState = { opened: true, mode: 'edit' };
    this.nuevoTituloLista = lista.title;
    this.cdr.markForCheck();

    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="nombre de la lista"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  /**
   *
   */
  public cerrarDrawer(): void {
    this.drawerState = { opened: false, mode: 'create' };
    this.nuevoTituloLista = '';
    this.cdr.markForCheck();
  }

  /**
   *
   */
  public async crearLista(): Promise<void> {
    if (!this.nuevoTituloLista || !this.nuevoTituloLista.trim()) {
      await this.notificationService.validationError('El nombre de la lista no puede estar vacío');
      return;
    }

    const titulo = this.nuevoTituloLista.trim();

    this.storageService
      .crearLista(titulo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          if (response.success && response.data) {
            await this.notificationService.successListaOperation('created', response.data.title);
            this.cerrarDrawer();
            this.loadListas();
          } else {
            await this.notificationService.errorDuplicate('lista');
          }
        },
        error: async () => {
          await this.notificationService.errorGeneric('crear la lista');
        },
      });
  }

  /**
   *
   */
  public async actualizarLista(): Promise<void> {
    if (!this.listaActual || !this.nuevoTituloLista.trim()) {
      await this.notificationService.validationError('El nombre de la lista no puede estar vacío');
      return;
    }

    this.storageService
      .actualizarLista(this.listaActual.id, this.nuevoTituloLista)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          if (response.success && response.data) {
            await this.notificationService.successListaOperation('updated', response.data.title);
            this.cerrarDrawer();

            if (this.listaActual) {
              this.listaActual.title = response.data.title;
              this.cdr.markForCheck();
            }
          } else {
            await this.notificationService.errorDuplicate('lista');
          }
        },
        error: () => this.notificationService.errorGeneric('actualizar la lista'),
      });
  }

  /**
   *
   * @param lista
   */
  public async eliminarLista(lista: Lista): Promise<void> {
    const result = await this.notificationService.confirmDeleteLista(lista.title);

    if (result.isConfirmed) {
      this.storageService
        .eliminarLista(lista.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            if (response.success) {
              await this.notificationService.successListaOperation('deleted');

              if (this.listaActual?.id === lista.id) {
                this.listaActual = null;
                this.cdr.markForCheck();
              }
            }
          },
          error: () => this.notificationService.errorGeneric('eliminar la lista'),
        });
    }
  }

  /**
   *
   * @param lista
   */
  public seleccionarLista(lista: Lista): void {
    this.storageService
      .getListaCompleta(lista.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            this.listaActual = response.data;
            this.actualizarEstadoSeleccion();
            this.cerrarDrawer();
            this.cdr.markForCheck();
          }
        },
        error: () => this.notificationService.errorGeneric('cargar la lista'),
      });
  }

  // ===== GESTIÓN DE TAREAS =====

  /**
   *
   */
  public async crearTarea(): Promise<void> {
    if (!this.listaActual || !this.nuevoTextoTarea.trim()) {
      await this.notificationService.validationError('El texto de la tarea no puede estar vacío');
      return;
    }

    this.storageService
      .crearTarea(this.listaActual.id, this.nuevoTextoTarea)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          if (response.success && response.data) {
            await this.notificationService.successTareaOperation('created');
            this.nuevoTextoTarea = '';
            this.recargarListaActual();
          } else {
            await this.notificationService.errorDuplicate('tarea');
          }
        },
        error: () => this.notificationService.errorGeneric('crear la tarea'),
      });
  }

  /**
   *
   * @param tarea
   */
  public iniciarEdicionTarea(tarea: Tarea): void {
    this.taskEditState = {
      isEditing: true,
      taskId: tarea.id,
      originalText: tarea.tarea,
    };
    this.nuevoTextoTarea = tarea.tarea;
    this.cdr.markForCheck();

    setTimeout(() => {
      const input = document.querySelector('input[matInput]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  /**
   *
   */
  public cancelarEdicionTarea(): void {
    this.taskEditState = { isEditing: false };
    this.nuevoTextoTarea = '';
    this.cdr.markForCheck();
  }

  /**
   *
   */
  public async actualizarTarea(): Promise<void> {
    if (!this.listaActual || !this.taskEditState.taskId || !this.nuevoTextoTarea.trim()) {
      await this.notificationService.validationError('El texto de la tarea no puede estar vacío');
      return;
    }

    this.storageService
      .actualizarTarea(this.listaActual.id, this.taskEditState.taskId, this.nuevoTextoTarea)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async response => {
          if (response.success) {
            await this.notificationService.successTareaOperation('updated');
            this.cancelarEdicionTarea();
            this.recargarListaActual();
          }
        },
        error: () => this.notificationService.errorGeneric('actualizar la tarea'),
      });
  }

  /**
   *
   * @param tarea
   */
  public async eliminarTarea(tarea: Tarea): Promise<void> {
    const result = await this.notificationService.confirmDeleteTarea();

    if (result.isConfirmed && this.listaActual) {
      this.storageService
        .eliminarTarea(this.listaActual.id, tarea.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            if (response.success) {
              await this.notificationService.successTareaOperation('deleted');
              this.recargarListaActual();
            }
          },
          error: () => this.notificationService.errorGeneric('eliminar la tarea'),
        });
    }
  }

  /**
   *
   * @param tarea
   */
  public toggleTareaCompleted(tarea: Tarea): void {
    if (!this.listaActual) {
      return;
    }

    this.storageService
      .toggleTareaCompleted(this.listaActual.id, tarea.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.recargarListaActual();
        },
        error: () => this.notificationService.errorGeneric('actualizar la tarea'),
      });
  }

  // ===== GESTIÓN DE SELECCIÓN MÚLTIPLE =====

  /**
   *
   */
  public toggleSeleccionarTodas(): void {
    if (!this.listaActual) {
      return;
    }

    const nuevoEstado = !this.selectionState.allSelected;

    this.storageService
      .toggleSeleccionarTodas(this.listaActual.id, nuevoEstado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.recargarListaActual();
        },
        error: () => this.notificationService.errorGeneric('seleccionar las tareas'),
      });
  }

  /**
   *
   */
  public async eliminarTareasSeleccionadas(): Promise<void> {
    if (!this.listaActual || !this.selectionState.hasSelected) {
      return;
    }

    const result = await this.notificationService.confirmDeleteTareasSeleccionadas(this.selectionState.selectedCount);

    if (result.isConfirmed) {
      this.storageService
        .eliminarTareasSeleccionadas(this.listaActual.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            if (response.success) {
              await this.notificationService.successTareaOperation('bulk_deleted', response.data);
              this.recargarListaActual();
            }
          },
          error: () => this.notificationService.errorGeneric('eliminar las tareas'),
        });
    }
  }

  // ===== DRAG & DROP =====

  /**
   *
   * @param event
   */
  public onTareaDrop(event: CdkDragDrop<Tarea[]>): void {
    if (!this.listaActual || event.previousIndex === event.currentIndex) {
      return;
    }

    this.storageService
      .reordenarTareas(this.listaActual.id, event.previousIndex, event.currentIndex)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.recargarListaActual();
        },
        error: () => this.notificationService.errorGeneric('reordenar las tareas'),
      });
  }

  // ===== GETTERS PARA EL TEMPLATE =====

  /**
   *
   */
  public get puedeSeleccionarTodas(): boolean {
    return this.listaActual?.tareas ? this.listaActual.tareas.length > 1 : false;
  }

  /**
   *
   */
  public get puedeEliminarSeleccionadas(): boolean {
    return this.selectionState.hasSelected;
  }

  /**
   *
   */
  public get textoBotonSeleccionar(): string {
    return this.selectionState.allSelected ? 'Deseleccionar todas' : 'Seleccionar todas';
  }

  /**
   *
   */
  public get modoFormulario(): 'create' | 'edit' {
    return this.drawerState.mode;
  }

  /**
   *
   */
  public get estaEditandoTarea(): boolean {
    return this.taskEditState.isEditing;
  }

  // ===== MÉTODOS PÚBLICOS PARA TEMPLATE =====

  /**
   *
   * @param listaId
   */
  public getTaskCount(listaId: string): number {
    try {
      const storageKey = `${StorageKeys.LISTA_PREFIX}${listaId}`;
      const tareasData = localStorage.getItem(storageKey);
      if (tareasData) {
        const tareas = JSON.parse(tareasData);
        return Array.isArray(tareas) ? tareas.length : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // ===== TRACKING FUNCTIONS PARA PERFORMANCE =====

  /**
   *
   * @param index
   * @param lista
   */
  public trackByListaId(index: number, lista: Lista): string {
    return lista.id;
  }

  /**
   *
   * @param index
   * @param tarea
   */
  public trackByTareaId(index: number, tarea: Tarea): string {
    return tarea.id;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   *
   */
  private loadListas(): void {
    this.storageService
      .getListas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            this.listas = response.data;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.notificationService.errorGeneric('cargar las listas');
        },
      });
  }

  /**
   *
   */
  private subscribeToListasChanges(): void {
    this.storageService.listas$.pipe(takeUntil(this.destroy$)).subscribe(listas => {
      this.listas = listas;

      if (this.listaActual && !listas.find(l => l.id === this.listaActual!.id)) {
        this.listaActual = null;
      }

      this.cdr.markForCheck();
    });
  }

  /**
   *
   */
  private recargarListaActual(): void {
    if (!this.listaActual) {
      return;
    }

    this.storageService
      .getListaCompleta(this.listaActual.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            this.listaActual = response.data;
            this.actualizarEstadoSeleccion();
            this.cdr.markForCheck();
          }
        },
      });
  }

  /**
   *
   */
  private actualizarEstadoSeleccion(): void {
    if (!this.listaActual?.tareas) {
      this.selectionState = { allSelected: false, hasSelected: false, selectedCount: 0 };
      return;
    }

    const tareasSeleccionadas = this.listaActual.tareas.filter(t => t.selected);
    const totalTareas = this.listaActual.tareas.length;

    this.selectionState = {
      allSelected: totalTareas > 0 && tareasSeleccionadas.length === totalTareas,
      hasSelected: tareasSeleccionadas.length > 0,
      selectedCount: tareasSeleccionadas.length,
    };
  }
}
