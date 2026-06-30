import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';
import { NotificationConfig } from '../models/notification-config.model';

/**
 *
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly defaultConfig: NotificationConfig = {
    confirmButtonText: 'Ok',
    cancelButtonText: 'Cancelar',
  };

  /**
   *
   */
  constructor() {}

  // ===== MÃ‰TODOS PRINCIPALES =====

  /**
   * Muestra una notificaciÃ³n de Ã©xito
   * @param message
   * @param title
   */
  public showSuccess(message: string, title: string = 'Correcto'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'success',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificaciÃ³n de error
   * @param message
   * @param title
   */
  public showError(message: string, title: string = 'Error'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'error',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificaciÃ³n de advertencia
   * @param message
   * @param title
   */
  public showWarning(message: string, title: string = 'Advertencia'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'warning',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificaciÃ³n de informaciÃ³n
   * @param message
   * @param title
   */
  public showInfo(message: string, title: string = 'InformaciÃ³n'): Promise<SweetAlertResult> {
    return this.show({
      title,
      text: message,
      icon: 'info',
      position: 'top-end',
    });
  }

  /**
   * Muestra una notificaciÃ³n de confirmaciÃ³n
   * @param message
   * @param title
   * @param confirmText
   * @param cancelText
   */
  public showConfirmation(
    message: string,
    title: string = 'Â¿EstÃ¡s seguro?',
    confirmText: string = 'SÃ­, continuar',
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
   * Muestra una notificaciÃ³n toast (pequeÃ±a y temporal)
   * @param message
   * @param icon
   * @param timer
   */
  public showToast(message: string, icon: SweetAlertIcon = 'success', timer: number = 3000): Promise<SweetAlertResult> {
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
   * Muestra una notificaciÃ³n personalizada
   * @param config
   */
  public show(config: NotificationConfig): Promise<SweetAlertResult> {
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
      // ConfiguraciÃ³n adicional para mejor UX
      allowOutsideClick: !finalConfig.showCancelButton, // No cerrar con click fuera si hay botÃ³n cancelar
      allowEscapeKey: true,
      focusConfirm: true,
      reverseButtons: true, // BotÃ³n de cancelar a la izquierda
      customClass: {
        confirmButton: 'btn btn-success mx-2',
        cancelButton: 'btn btn-outline-secondary mx-2',
      },
      buttonsStyling: false,
    });
  }

  // ===== MÃ‰TODOS ESPECÃFICOS PARA LA APLICACIÃ“N =====

  /**
   * ConfirmaciÃ³n para eliminar una lista
   * @param nombreLista
   */
  public confirmDeleteLista(nombreLista: string): Promise<SweetAlertResult> {
    return this.showConfirmation(
      `Se eliminarÃ¡ la lista "${nombreLista}" y todas sus tareas. Esta acciÃ³n no se puede deshacer.`,
      'Â¿Eliminar lista?',
      'SÃ­, eliminar',
      'Cancelar'
    );
  }

  /**
   * ConfirmaciÃ³n para eliminar una tarea
   */
  public confirmDeleteTarea(): Promise<SweetAlertResult> {
    return this.showConfirmation(
      'Se eliminarÃ¡ la tarea seleccionada. Esta acciÃ³n no se puede deshacer.',
      'Â¿Eliminar tarea?',
      'SÃ­, eliminar',
      'Cancelar'
    );
  }

  /**
   * ConfirmaciÃ³n para eliminar tareas seleccionadas
   * @param cantidad
   */
  public confirmDeleteTareasSeleccionadas(cantidad: number): Promise<SweetAlertResult> {
    const mensaje =
      cantidad === 1 ? 'Se eliminarÃ¡ la tarea seleccionada.' : `Se eliminarÃ¡n ${cantidad} tareas seleccionadas.`;

    return this.showConfirmation(
      `${mensaje} Esta acciÃ³n no se puede deshacer.`,
      'Â¿Eliminar tareas?',
      'SÃ­, eliminar',
      'Cancelar'
    );
  }

  /**
   * NotificaciÃ³n de Ã©xito para operaciones de lista
   * @param operation
   * @param nombreLista
   */
  public successListaOperation(
    operation: 'created' | 'updated' | 'deleted',
    nombreLista?: string
  ): Promise<SweetAlertResult> {
    const messages = {
      created: 'Lista creada correctamente',
      updated: 'Lista actualizada correctamente',
      deleted: 'Lista eliminada correctamente',
    };

    const message = nombreLista ? `${messages[operation]}: "${nombreLista}"` : messages[operation];

    return this.showSuccess(message);
  }

  /**
   * NotificaciÃ³n de Ã©xito para operaciones de tarea
   * @param operation
   * @param count
   */
  public successTareaOperation(
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
   * NotificaciÃ³n de error para operaciones duplicadas
   * @param type
   */
  public errorDuplicate(type: 'lista' | 'tarea'): Promise<SweetAlertResult> {
    const message = type === 'lista' ? 'Ya existe una lista con ese nombre' : 'Ya existe una tarea con ese texto';

    return this.showError(message);
  }

  /**
   * NotificaciÃ³n de error genÃ©rico
   * @param operation
   */
  public errorGeneric(operation: string): Promise<SweetAlertResult> {
    return this.showError(`Ha ocurrido un error al ${operation}. Por favor, intÃ©ntalo de nuevo.`);
  }

  /**
   * NotificaciÃ³n de validaciÃ³n
   * @param message
   */
  public validationError(message: string): Promise<SweetAlertResult> {
    return this.showWarning(message, 'Datos incompletos');
  }

  // ===== MÃ‰TODOS UTILITARIOS =====

  /**
   * Cierra cualquier notificaciÃ³n activa
   */
  public close(): void {
    Swal.close();
  }

  /**
   * Verifica si hay una notificaciÃ³n activa
   */
  public isVisible(): boolean {
    return Swal.isVisible();
  }

  /**
   * Muestra un loading personalizado
   * @param message
   */
  public showLoading(message: string = 'Procesando...'): void {
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
  public hideLoading(): void {
    Swal.close();
  }
}
