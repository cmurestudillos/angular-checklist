import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';
import { NotificationConfig } from '../models/notification-config.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly defaultConfig: NotificationConfig = {
    confirmButtonText: 'Ok',
    cancelButtonText: 'Cancelar',
  };

  constructor() {}

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Muestra una notificación de éxito
   */
  showSuccess(message: string, title: string = 'Correcto'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'success',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificación de error
   */
  showError(message: string, title: string = 'Error'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'error',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificación de advertencia
   */
  showWarning(message: string, title: string = 'Advertencia'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'warning',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificación de información
   */
  showInfo(message: string, title: string = 'Información'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'info',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificación de confirmación
   */
  showConfirmation(
    message: string,
    title: string = '¿Estás seguro?',
    confirmText: string = 'Sí, continuar',
    cancelText: string = 'Cancelar'
  ): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'question',
      position: 'center',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    });
  }

  /**
   * Muestra una notificación toast (pequeña y temporal)
   */
  showToast(message: string, icon: SweetAlertIcon = 'success', timer: number = 3000): Promise<SweetAlertResult> {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: toast => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  }

  /**
   * Muestra una notificación personalizada
   */
  show(config: NotificationConfig): Promise<SweetAlertResult> {
    const finalConfig = { ...this.defaultConfig, ...config };

    return Swal.fire({
      title: finalConfig.title,
      text: finalConfig.text,
      icon: finalConfig.icon,
      confirmButtonText: finalConfig.confirmButtonText,
      cancelButtonText: finalConfig.cancelButtonText,
      showCancelButton: finalConfig.showCancelButton,
      timer: finalConfig.timer,
      toast: finalConfig.toast,
      position: finalConfig.position,
      // Configuración adicional para mejor UX
      allowOutsideClick: !finalConfig.showCancelButton, // No cerrar con click fuera si hay botón cancelar
      allowEscapeKey: true,
      focusConfirm: true,
      reverseButtons: true, // Botón de cancelar a la izquierda
      customClass: {
        confirmButton: 'btn btn-success mx-2',
        cancelButton: 'btn btn-outline-secondary mx-2',
      },
      buttonsStyling: false,
    });
  }

  // ===== MÉTODOS ESPECÍFICOS PARA LA APLICACIÓN =====

  /**
   * Confirmación para eliminar una lista
   */
  confirmDeleteLista(nombreLista: string): Promise<SweetAlertResult> {
    return this.showConfirmation(
      `Se eliminará la lista "${nombreLista}" y todas sus tareas. Esta acción no se puede deshacer.`,
      '¿Eliminar lista?',
      'Sí, eliminar',
      'Cancelar'
    );
  }

  /**
   * Confirmación para eliminar una tarea
   */
  confirmDeleteTarea(): Promise<SweetAlertResult> {
    return this.showConfirmation(
      'Se eliminará la tarea seleccionada. Esta acción no se puede deshacer.',
      '¿Eliminar tarea?',
      'Sí, eliminar',
      'Cancelar'
    );
  }

  /**
   * Confirmación para eliminar tareas seleccionadas
   */
  confirmDeleteTareasSeleccionadas(cantidad: number): Promise<SweetAlertResult> {
    const mensaje =
      cantidad === 1 ? 'Se eliminará la tarea seleccionada.' : `Se eliminarán ${cantidad} tareas seleccionadas.`;

    return this.showConfirmation(
      `${mensaje} Esta acción no se puede deshacer.`,
      '¿Eliminar tareas?',
      'Sí, eliminar',
      'Cancelar'
    );
  }

  /**
   * Notificación de éxito para operaciones de lista
   */
  successListaOperation(operation: 'created' | 'updated' | 'deleted', nombreLista?: string): Promise<SweetAlertResult> {
    const messages = {
      created: 'Lista creada correctamente',
      updated: 'Lista actualizada correctamente',
      deleted: 'Lista eliminada correctamente',
    };

    const message = nombreLista ? `${messages[operation]}: "${nombreLista}"` : messages[operation];

    return this.showSuccess(message);
  }

  /**
   * Notificación de éxito para operaciones de tarea
   */
  successTareaOperation(
    operation: 'created' | 'updated' | 'deleted' | 'bulk_deleted',
    count?: number
  ): Promise<SweetAlertResult> {
    const messages = {
      created: 'Tarea creada correctamente',
      updated: 'Tarea actualizada correctamente',
      deleted: 'Tarea eliminada correctamente',
      bulk_deleted: count && count > 1 ? `${count} tareas eliminadas correctamente` : 'Tarea eliminada correctamente',
    };

    return this.showSuccess(messages[operation]);
  }

  /**
   * Notificación de error para operaciones duplicadas
   */
  errorDuplicate(type: 'lista' | 'tarea'): Promise<SweetAlertResult> {
    const message = type === 'lista' ? 'Ya existe una lista con ese nombre' : 'Ya existe una tarea con ese texto';

    return this.showError(message);
  }

  /**
   * Notificación de error genérico
   */
  errorGeneric(operation: string): Promise<SweetAlertResult> {
    return this.showError(`Ha ocurrido un error al ${operation}. Por favor, inténtalo de nuevo.`);
  }

  /**
   * Notificación de validación
   */
  validationError(message: string): Promise<SweetAlertResult> {
    return this.showWarning(message, 'Datos incompletos');
  }

  // ===== MÉTODOS UTILITARIOS =====

  /**
   * Cierra cualquier notificación activa
   */
  close(): void {
    Swal.close();
  }

  /**
   * Verifica si hay una notificación activa
   */
  isVisible(): boolean {
    return Swal.isVisible();
  }

  /**
   * Muestra un loading personalizado
   */
  showLoading(message: string = 'Procesando...'): void {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  /**
   * Oculta el loading
   */
  hideLoading(): void {
    Swal.close();
  }
}
