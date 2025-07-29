import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';
import { StorageKeys } from '../enums/storage-keys.enum';
import { ListaCompleta } from '../models/lista-completa.model';
import { Lista } from '../models/lista.model';
import { Tarea } from '../models/tarea.model';
import { ServiceResponse } from '../types/service-response.type';
import { UuidUtil } from '../utils/uuid.util';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly storageAvailable: boolean;

  // Estado reactivo para las listas
  private listasSubject = new BehaviorSubject<Lista[]>([]);
  public listas$ = this.listasSubject.asObservable();

  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    this.loadListasFromStorage();
  }

  // ===== MÉTODOS PRIVADOS DE UTILIDAD =====

  private checkStorageAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private handleStorageError<T>(error: any): Observable<ServiceResponse<T>> {
    console.error('Storage error:', error);
    return of({
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
      statusCode: 500,
    });
  }

  private generateStorageKey(listaId: string): string {
    return `${StorageKeys.LISTA_PREFIX}${listaId}`;
  }

  private loadListasFromStorage(): void {
    if (!this.storageAvailable) return;

    try {
      const listasMetaData = localStorage.getItem(StorageKeys.LISTAS_META);
      if (listasMetaData) {
        const listas: Lista[] = JSON.parse(listasMetaData);
        this.listasSubject.next(listas);
      }
    } catch (error) {
      console.error('Error loading listas from storage:', error);
    }
  }

  private saveListasMetaData(listas: Lista[]): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(StorageKeys.LISTAS_META, JSON.stringify(listas));
      this.listasSubject.next(listas);
    } catch (error) {
      console.error('Error saving listas metadata:', error);
    }
  }

  // ===== MÉTODOS PÚBLICOS PARA LISTAS =====

  public getListas(): Observable<ServiceResponse<Lista[]>> {
    try {
      const currentListas = this.listasSubject.value;
      return of({
        success: true,
        data: currentListas,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public getListaCompleta(listaId: string): Observable<ServiceResponse<ListaCompleta>> {
    try {
      const listas = this.listasSubject.value;
      const lista = listas.find(l => l.id === listaId);

      if (!lista) {
        return of({
          success: false,
          error: ERROR_MESSAGES.LISTA_NOT_FOUND,
          statusCode: 404,
        });
      }

      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const listaCompleta: ListaCompleta = {
        ...lista,
        tareas,
      };

      return of({
        success: true,
        data: listaCompleta,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public crearLista(titulo: string): Observable<ServiceResponse<Lista>> {
    try {
      const currentListas = this.listasSubject.value;

      // Verificar si ya existe una lista con ese título
      if (currentListas.some(lista => lista.title.toLowerCase() === titulo.toLowerCase())) {
        return of({
          success: false,
          error: ERROR_MESSAGES.LISTA_EXISTS,
          statusCode: 409,
        });
      }

      const nuevaLista: Lista = {
        id: UuidUtil.generate(),
        title: titulo.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedListas = [...currentListas, nuevaLista];
      this.saveListasMetaData(updatedListas);

      // Crear el storage para las tareas de esta lista
      const storageKey = this.generateStorageKey(nuevaLista.id);
      localStorage.setItem(storageKey, JSON.stringify([]));

      return of({
        success: true,
        data: nuevaLista,
        statusCode: 201,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public actualizarLista(listaId: string, nuevoTitulo: string): Observable<ServiceResponse<Lista>> {
    try {
      const currentListas = this.listasSubject.value;
      const listaIndex = currentListas.findIndex(l => l.id === listaId);

      if (listaIndex === -1) {
        return of({
          success: false,
          error: ERROR_MESSAGES.LISTA_NOT_FOUND,
          statusCode: 404,
        });
      }

      // Verificar que no exista otra lista con el mismo título
      const tituloExiste = currentListas.some(
        (lista, index) => index !== listaIndex && lista.title.toLowerCase() === nuevoTitulo.toLowerCase()
      );

      if (tituloExiste) {
        return of({
          success: false,
          error: ERROR_MESSAGES.LISTA_EXISTS,
          statusCode: 409,
        });
      }

      const listaActualizada: Lista = {
        ...currentListas[listaIndex],
        title: nuevoTitulo.trim(),
        updatedAt: new Date(),
      };

      const updatedListas = [...currentListas];
      updatedListas[listaIndex] = listaActualizada;

      this.saveListasMetaData(updatedListas);

      return of({
        success: true,
        data: listaActualizada,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public eliminarLista(listaId: string): Observable<ServiceResponse<void>> {
    try {
      const currentListas = this.listasSubject.value;
      const listaIndex = currentListas.findIndex(l => l.id === listaId);

      if (listaIndex === -1) {
        return of({
          success: false,
          error: ERROR_MESSAGES.LISTA_NOT_FOUND,
          statusCode: 404,
        });
      }

      // Eliminar las tareas de la lista
      const storageKey = this.generateStorageKey(listaId);
      localStorage.removeItem(storageKey);

      // Eliminar la lista de la metadata
      const updatedListas = currentListas.filter(l => l.id !== listaId);
      this.saveListasMetaData(updatedListas);

      return of({
        success: true,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  // ===== MÉTODOS PÚBLICOS PARA TAREAS =====

  public getTareas(listaId: string): Observable<ServiceResponse<Tarea[]>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      return of({
        success: true,
        data: tareas,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public crearTarea(listaId: string, textoTarea: string): Observable<ServiceResponse<Tarea>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      // Verificar si ya existe una tarea con ese texto
      if (tareas.some(tarea => tarea.tarea.toLowerCase() === textoTarea.toLowerCase())) {
        return of({
          success: false,
          error: ERROR_MESSAGES.TAREA_EXISTS,
          statusCode: 409,
        });
      }

      const nuevaTarea: Tarea = {
        id: UuidUtil.generate(),
        tarea: textoTarea.trim(),
        completed: false,
        selected: false,
        position: tareas.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tareasActualizadas = [...tareas, nuevaTarea];
      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        data: nuevaTarea,
        statusCode: 201,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public actualizarTarea(listaId: string, tareaId: string, nuevoTexto: string): Observable<ServiceResponse<Tarea>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const tareaIndex = tareas.findIndex(t => t.id === tareaId);
      if (tareaIndex === -1) {
        return of({
          success: false,
          error: ERROR_MESSAGES.TAREA_NOT_FOUND,
          statusCode: 404,
        });
      }

      const tareaActualizada: Tarea = {
        ...tareas[tareaIndex],
        tarea: nuevoTexto.trim(),
        updatedAt: new Date(),
      };

      const tareasActualizadas = [...tareas];
      tareasActualizadas[tareaIndex] = tareaActualizada;

      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        data: tareaActualizada,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public toggleTareaCompleted(listaId: string, tareaId: string): Observable<ServiceResponse<Tarea>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const tareaIndex = tareas.findIndex(t => t.id === tareaId);
      if (tareaIndex === -1) {
        return of({
          success: false,
          error: ERROR_MESSAGES.TAREA_NOT_FOUND,
          statusCode: 404,
        });
      }

      const tareaActualizada: Tarea = {
        ...tareas[tareaIndex],
        completed: !tareas[tareaIndex].completed,
        selected: !tareas[tareaIndex].completed, // Mantener sincronizados
        updatedAt: new Date(),
      };

      const tareasActualizadas = [...tareas];
      tareasActualizadas[tareaIndex] = tareaActualizada;

      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        data: tareaActualizada,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public eliminarTarea(listaId: string, tareaId: string): Observable<ServiceResponse<void>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const tareasActualizadas = tareas.filter(t => t.id !== tareaId);

      if (tareasActualizadas.length === tareas.length) {
        return of({
          success: false,
          error: ERROR_MESSAGES.TAREA_NOT_FOUND,
          statusCode: 404,
        });
      }

      // Reindexar posiciones
      tareasActualizadas.forEach((tarea, index) => {
        tarea.position = index;
      });

      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public eliminarTareasSeleccionadas(listaId: string): Observable<ServiceResponse<number>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const tareasOriginales = tareas.length;
      const tareasActualizadas = tareas.filter(t => !t.selected);
      const tareasEliminadas = tareasOriginales - tareasActualizadas.length;

      // Reindexar posiciones
      tareasActualizadas.forEach((tarea, index) => {
        tarea.position = index;
      });

      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        data: tareasEliminadas,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public reordenarTareas(listaId: string, fromIndex: number, toIndex: number): Observable<ServiceResponse<Tarea[]>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      // Mover el elemento
      const tareasReordenadas = [...tareas];
      const [movedItem] = tareasReordenadas.splice(fromIndex, 1);
      tareasReordenadas.splice(toIndex, 0, movedItem);

      // Actualizar posiciones
      tareasReordenadas.forEach((tarea, index) => {
        tarea.position = index;
        tarea.updatedAt = new Date();
      });

      localStorage.setItem(storageKey, JSON.stringify(tareasReordenadas));

      return of({
        success: true,
        data: tareasReordenadas,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  public toggleSeleccionarTodas(listaId: string, seleccionar: boolean): Observable<ServiceResponse<Tarea[]>> {
    try {
      const storageKey = this.generateStorageKey(listaId);
      const tareasData = localStorage.getItem(storageKey);
      const tareas: Tarea[] = tareasData ? JSON.parse(tareasData) : [];

      const tareasActualizadas = tareas.map(tarea => ({
        ...tarea,
        selected: seleccionar,
        completed: seleccionar,
        updatedAt: new Date(),
      }));

      localStorage.setItem(storageKey, JSON.stringify(tareasActualizadas));

      return of({
        success: true,
        data: tareasActualizadas,
        statusCode: 200,
      });
    } catch (error) {
      return this.handleStorageError(error);
    }
  }
}
