import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';

// Servicios
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notificacion.service';

// Modelos
import { DrawerState } from '../../models/drawer-state.model';
import { ListaCompleta } from '../../models/lista-completa.model';
import { Lista } from '../../models/lista.model';
import { SelectionState } from '../../models/selection-state.model';
import { Tarea } from '../../models/tarea.model';
import { TaskEditState } from '../../models/task-edit-state.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  // ===== ESTADO DE LA APLICACIÓN =====

  // Estado de listas
  listas: Lista[] = [];
  listaActual: ListaCompleta | null = null;

  // Estado de formularios
  nuevoTituloLista = '';
  nuevoTextoTarea = '';

  // Estado de UI
  drawerState: DrawerState = { opened: false, mode: 'create' };
  taskEditState: TaskEditState = { isEditing: false };
  selectionState: SelectionState = { allSelected: false, hasSelected: false, selectedCount: 0 };

  // Control de destrucción para suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  // ===== LIFECYCLE HOOKS =====

  ngOnInit(): void {
    console.log('🚀 HomeComponent inicializando...');

    // Verificar servicios
    this.checkServices();

    // Cargar listas existentes
    this.loadListas();

    // Suscribirse a cambios de listas
    this.subscribeToListasChanges();

    // Método de debugging (remover en producción)
    setTimeout(() => {
      this.debugState();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PRIVADOS DE INICIALIZACIÓN =====

  private checkServices(): void {
    console.log('🔍 Verificando servicios...');

    console.log('StorageService:', this.storageService ? '✅' : '❌');
    console.log('NotificationService:', this.notificationService ? '✅' : '❌');

    if (this.storageService) {
      console.log('StorageService methods:');
      console.log('- crearLista:', typeof this.storageService.crearLista);
      console.log('- getListas:', typeof this.storageService.getListas);
    }
  }

  private loadListas(): void {
    console.log('🔄 Cargando listas...');

    this.storageService
      .getListas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            console.log('✅ Listas cargadas:', response.data);
            this.listas = response.data;
            this.cdr.markForCheck();
          } else {
            console.log('❌ Error cargando listas:', response.error);
          }
        },
        error: error => {
          console.error('❌ Error en loadListas:', error);
          this.notificationService.errorGeneric('cargar las listas');
        },
      });
  }

  private subscribeToListasChanges(): void {
    this.storageService.listas$.pipe(takeUntil(this.destroy$)).subscribe(listas => {
      this.listas = listas;

      // Si estamos viendo una lista que fue eliminada, limpiar la vista
      if (this.listaActual && !listas.find(l => l.id === this.listaActual!.id)) {
        this.listaActual = null;
      }

      this.cdr.markForCheck();
    });
  }

  // ===== GESTIÓN DE LISTAS =====

  abrirFormularioNuevaLista(): void {
    console.log('🚀 Abriendo formulario nueva lista...');

    this.drawerState = { opened: true, mode: 'create' };
    this.nuevoTituloLista = '';
    this.listaActual = null;

    console.log('Estado actualizado:', {
      drawerState: this.drawerState,
      nuevoTituloLista: this.nuevoTituloLista,
      modoFormulario: this.modoFormulario,
    });

    this.cdr.markForCheck();

    // Enfocar el input después de que se abra el modal
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="nombre de la lista"]') as HTMLInputElement;
      if (input) {
        input.focus();
        console.log('✅ Input enfocado');
      } else {
        console.log('❌ Input no encontrado');
      }
    }, 100);
  }

  abrirFormularioEditarLista(lista: Lista): void {
    console.log('🚀 Abriendo formulario editar lista:', lista);

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

  cerrarDrawer(): void {
    console.log('🚪 Cerrando drawer...');

    this.drawerState = { opened: false, mode: 'create' };
    this.nuevoTituloLista = '';

    this.cdr.markForCheck();
  }

  async crearLista(): Promise<void> {
    console.log('🚀 Iniciando creación de lista...');
    console.log('Título ingresado:', `"${this.nuevoTituloLista}"`);

    // Validación mejorada
    if (!this.nuevoTituloLista || !this.nuevoTituloLista.trim()) {
      console.log('❌ Validación fallida: título vacío');
      await this.notificationService.validationError('El nombre de la lista no puede estar vacío');
      return;
    }

    const titulo = this.nuevoTituloLista.trim();
    console.log('Título procesado:', `"${titulo}"`);

    try {
      console.log('📡 Llamando a storageService.crearLista...');

      this.storageService
        .crearLista(titulo)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            console.log('📨 Respuesta recibida:', response);

            if (response.success && response.data) {
              console.log('✅ Lista creada exitosamente:', response.data);

              // Mostrar notificación de éxito
              await this.notificationService.successListaOperation('created', response.data.title);

              // Cerrar el modal
              this.cerrarDrawer();

              // Actualizar la lista de listas
              this.loadListas();

              console.log('✅ Proceso completado exitosamente');
            } else {
              console.log('❌ Error en la respuesta:', response.error);
              await this.notificationService.errorDuplicate('lista');
            }
          },
          error: async error => {
            console.error('❌ Error en la suscripción:', error);
            await this.notificationService.errorGeneric('crear la lista');
          },
        });
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      await this.notificationService.errorGeneric('crear la lista');
    }
  }

  async actualizarLista(): Promise<void> {
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

            // Actualizar la lista actual
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

  async eliminarLista(lista: Lista): Promise<void> {
    const result = await this.notificationService.confirmDeleteLista(lista.title);

    if (result.isConfirmed) {
      this.storageService
        .eliminarLista(lista.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async response => {
            if (response.success) {
              await this.notificationService.successListaOperation('deleted');

              // Si era la lista actual, limpiar la vista
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

  seleccionarLista(lista: Lista): void {
    console.log('📋 Seleccionando lista:', lista);

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

  async crearTarea(): Promise<void> {
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

  iniciarEdicionTarea(tarea: Tarea): void {
    this.taskEditState = {
      isEditing: true,
      taskId: tarea.id,
      originalText: tarea.tarea,
    };
    this.nuevoTextoTarea = tarea.tarea;
    this.cdr.markForCheck();

    // Enfocar el input
    setTimeout(() => {
      const input = document.querySelector('input[matInput]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  cancelarEdicionTarea(): void {
    this.taskEditState = { isEditing: false };
    this.nuevoTextoTarea = '';
    this.cdr.markForCheck();
  }

  async actualizarTarea(): Promise<void> {
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

  async eliminarTarea(tarea: Tarea): Promise<void> {
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

  toggleTareaCompleted(tarea: Tarea): void {
    if (!this.listaActual) return;

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

  toggleSeleccionarTodas(): void {
    if (!this.listaActual) return;

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

  async eliminarTareasSeleccionadas(): Promise<void> {
    if (!this.listaActual || !this.selectionState.hasSelected) return;

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

  onTareaDrop(event: CdkDragDrop<Tarea[]>): void {
    if (!this.listaActual || event.previousIndex === event.currentIndex) return;

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

  // ===== MÉTODOS DE UTILIDAD =====

  private recargarListaActual(): void {
    if (!this.listaActual) return;

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

  getTaskCount(listaId: string): number {
    try {
      const storageKey = `checklist_lista_${listaId}`;
      const tareasData = localStorage.getItem(storageKey);
      if (tareasData) {
        const tareas = JSON.parse(tareasData);
        return Array.isArray(tareas) ? tareas.length : 0;
      }
      return 0;
    } catch (error) {
      console.warn('Error getting task count:', error);
      return 0;
    }
  }

  // ===== GETTERS PARA EL TEMPLATE =====

  get puedeSeleccionarTodas(): boolean {
    return this.listaActual?.tareas ? this.listaActual.tareas.length > 1 : false;
  }

  get puedeEliminarSeleccionadas(): boolean {
    return this.selectionState.hasSelected;
  }

  get textoBotonSeleccionar(): string {
    return this.selectionState.allSelected ? 'Deseleccionar todas' : 'Seleccionar todas';
  }

  get modoFormulario(): 'create' | 'edit' {
    return this.drawerState.mode;
  }

  get estaEditandoTarea(): boolean {
    return this.taskEditState.isEditing;
  }

  // ===== TRACKING FUNCTIONS PARA PERFORMANCE =====

  trackByListaId(index: number, lista: Lista): string {
    return lista.id;
  }

  trackByTareaId(index: number, tarea: Tarea): string {
    return tarea.id;
  }

  // ===== MÉTODOS DE DEBUG (REMOVER EN PRODUCCIÓN) =====

  debugState(): void {
    console.log('=== DEBUG STATE ===');
    console.log('drawerState:', this.drawerState);
    console.log('nuevoTituloLista:', this.nuevoTituloLista);
    console.log('modoFormulario:', this.modoFormulario);
    console.log('listas:', this.listas);
    console.log('listaActual:', this.listaActual);
    console.log('localStorage keys:', Object.keys(localStorage));
  }

  testStorageService(): void {
    console.log('=== TEST STORAGE SERVICE ===');

    // Test básico de creación
    this.storageService.crearLista('Test Lista ' + Date.now()).subscribe({
      next: response => {
        console.log('Test crearLista response:', response);
        if (response.success) {
          console.log('✅ StorageService funcionando correctamente');
        } else {
          console.log('❌ StorageService error:', response.error);
        }
      },
      error: error => {
        console.error('❌ StorageService error:', error);
      },
    });
  }

  onDebugClick(): void {
    this.debugState();
    this.testStorageService();
  }

  resetState(): void {
    console.log('🔄 Reseteando estado...');

    this.drawerState = { opened: false, mode: 'create' };
    this.nuevoTituloLista = '';
    this.taskEditState = { isEditing: false };
    this.selectionState = { allSelected: false, hasSelected: false, selectedCount: 0 };

    this.cdr.markForCheck();
    console.log('✅ Estado reseteado');
  }
}
