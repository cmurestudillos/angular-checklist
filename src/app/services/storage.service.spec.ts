import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ===== LISTAS =====

  describe('getListas()', () => {
    it('should return empty array when no lists exist', async () => {
      const res = await firstValueFrom(service.getListas());
      expect(res.success).toBeTrue();
      expect(res.data).toEqual([]);
    });

    it('should reflect lists after creation', async () => {
      await firstValueFrom(service.crearLista('Lista A'));
      const res = await firstValueFrom(service.getListas());
      expect(res.data?.length).toBe(1);
    });
  });

  describe('crearLista()', () => {
    it('should create a list and return 201', async () => {
      const res = await firstValueFrom(service.crearLista('Mi Lista'));
      expect(res.success).toBeTrue();
      expect(res.statusCode).toBe(201);
      expect(res.data?.title).toBe('Mi Lista');
      expect(res.data?.id).toBeTruthy();
    });

    it('should trim whitespace from title', async () => {
      const res = await firstValueFrom(service.crearLista('  Espacios  '));
      expect(res.data?.title).toBe('Espacios');
    });

    it('should reject duplicate names (case-insensitive)', async () => {
      await firstValueFrom(service.crearLista('Lista'));
      const res = await firstValueFrom(service.crearLista('lista'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(409);
    });

    it('should emit the new list on listas$', async () => {
      await firstValueFrom(service.crearLista('Lista Reactiva'));
      const listas = await firstValueFrom(service.listas$);
      expect(listas.some(l => l.title === 'Lista Reactiva')).toBeTrue();
    });

    it('should initialize an empty tasks array in localStorage', async () => {
      const res = await firstValueFrom(service.crearLista('Lista con Tareas'));
      const id = res.data!.id;
      const raw = localStorage.getItem(`checklist_lista_${id}`);
      expect(JSON.parse(raw!)).toEqual([]);
    });
  });

  describe('actualizarLista()', () => {
    it('should update the title', async () => {
      const created = await firstValueFrom(service.crearLista('Original'));
      const id = created.data!.id;
      const res = await firstValueFrom(service.actualizarLista(id, 'Actualizada'));
      expect(res.success).toBeTrue();
      expect(res.data?.title).toBe('Actualizada');
    });

    it('should return 404 for a non-existent list', async () => {
      const res = await firstValueFrom(service.actualizarLista('no-existe', 'Nuevo'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(404);
    });

    it('should reject rename to an existing title', async () => {
      await firstValueFrom(service.crearLista('Lista A'));
      const b = await firstValueFrom(service.crearLista('Lista B'));
      const res = await firstValueFrom(service.actualizarLista(b.data!.id, 'Lista A'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(409);
    });
  });

  describe('eliminarLista()', () => {
    it('should delete the list and its tasks', async () => {
      const created = await firstValueFrom(service.crearLista('A eliminar'));
      const id = created.data!.id;
      await firstValueFrom(service.crearTarea(id, 'Tarea'));

      const res = await firstValueFrom(service.eliminarLista(id));
      expect(res.success).toBeTrue();

      const listas = await firstValueFrom(service.getListas());
      expect(listas.data?.find(l => l.id === id)).toBeUndefined();
      expect(localStorage.getItem(`checklist_lista_${id}`)).toBeNull();
    });

    it('should return 404 for a non-existent list', async () => {
      const res = await firstValueFrom(service.eliminarLista('fantasma'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(404);
    });
  });

  // ===== TAREAS =====

  describe('crearTarea()', () => {
    let listaId: string;

    beforeEach(async () => {
      const res = await firstValueFrom(service.crearLista('Lista Test'));
      listaId = res.data!.id;
    });

    it('should create a task and return 201', async () => {
      const res = await firstValueFrom(service.crearTarea(listaId, 'Hacer algo'));
      expect(res.success).toBeTrue();
      expect(res.statusCode).toBe(201);
      expect(res.data?.tarea).toBe('Hacer algo');
      expect(res.data?.completed).toBeFalse();
      expect(res.data?.selected).toBeFalse();
    });

    it('should assign sequential position', async () => {
      await firstValueFrom(service.crearTarea(listaId, 'Tarea 1'));
      const res = await firstValueFrom(service.crearTarea(listaId, 'Tarea 2'));
      expect(res.data?.position).toBe(1);
    });

    it('should reject duplicate task text (case-insensitive)', async () => {
      await firstValueFrom(service.crearTarea(listaId, 'Tarea'));
      const res = await firstValueFrom(service.crearTarea(listaId, 'tarea'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(409);
    });

    it('should trim whitespace from task text', async () => {
      const res = await firstValueFrom(service.crearTarea(listaId, '  Tarea con espacios  '));
      expect(res.data?.tarea).toBe('Tarea con espacios');
    });
  });

  describe('actualizarTarea()', () => {
    let listaId: string;
    let tareaId: string;

    beforeEach(async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      listaId = lista.data!.id;
      const tarea = await firstValueFrom(service.crearTarea(listaId, 'Original'));
      tareaId = tarea.data!.id;
    });

    it('should update the task text', async () => {
      const res = await firstValueFrom(service.actualizarTarea(listaId, tareaId, 'Actualizada'));
      expect(res.success).toBeTrue();
      expect(res.data?.tarea).toBe('Actualizada');
    });

    it('should return 404 for a non-existent task', async () => {
      const res = await firstValueFrom(service.actualizarTarea(listaId, 'no-existe', 'Texto'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(404);
    });
  });

  describe('toggleTareaCompleted()', () => {
    let listaId: string;
    let tareaId: string;

    beforeEach(async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      listaId = lista.data!.id;
      const tarea = await firstValueFrom(service.crearTarea(listaId, 'Tarea'));
      tareaId = tarea.data!.id;
    });

    it('should mark as completed on first toggle', async () => {
      const res = await firstValueFrom(service.toggleTareaCompleted(listaId, tareaId));
      expect(res.data?.completed).toBeTrue();
      expect(res.data?.selected).toBeTrue();
    });

    it('should mark as incomplete on second toggle', async () => {
      await firstValueFrom(service.toggleTareaCompleted(listaId, tareaId));
      const res = await firstValueFrom(service.toggleTareaCompleted(listaId, tareaId));
      expect(res.data?.completed).toBeFalse();
      expect(res.data?.selected).toBeFalse();
    });
  });

  describe('eliminarTarea()', () => {
    it('should remove the task and reindex positions', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const listaId = lista.data!.id;
      await firstValueFrom(service.crearTarea(listaId, 'Tarea A'));
      const b = await firstValueFrom(service.crearTarea(listaId, 'Tarea B'));
      await firstValueFrom(service.crearTarea(listaId, 'Tarea C'));

      await firstValueFrom(service.eliminarTarea(listaId, b.data!.id));

      const tareas = await firstValueFrom(service.getTareas(listaId));
      expect(tareas.data?.length).toBe(2);
      expect(tareas.data?.map(t => t.position)).toEqual([0, 1]);
    });

    it('should return 404 for a non-existent task', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const res = await firstValueFrom(service.eliminarTarea(lista.data!.id, 'no-existe'));
      expect(res.success).toBeFalse();
      expect(res.statusCode).toBe(404);
    });
  });

  describe('reordenarTareas()', () => {
    it('should move a task from one position to another', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const listaId = lista.data!.id;
      await firstValueFrom(service.crearTarea(listaId, 'A'));
      await firstValueFrom(service.crearTarea(listaId, 'B'));
      await firstValueFrom(service.crearTarea(listaId, 'C'));

      const res = await firstValueFrom(service.reordenarTareas(listaId, 0, 2));
      expect(res.data?.map(t => t.tarea)).toEqual(['B', 'C', 'A']);
      expect(res.data?.map(t => t.position)).toEqual([0, 1, 2]);
    });
  });

  describe('toggleSeleccionarTodas()', () => {
    it('should select and complete all tasks', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const listaId = lista.data!.id;
      await firstValueFrom(service.crearTarea(listaId, 'T1'));
      await firstValueFrom(service.crearTarea(listaId, 'T2'));

      const res = await firstValueFrom(service.toggleSeleccionarTodas(listaId, true));
      expect(res.data?.every(t => t.selected && t.completed)).toBeTrue();
    });

    it('should deselect and uncomplete all tasks', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const listaId = lista.data!.id;
      await firstValueFrom(service.crearTarea(listaId, 'T1'));
      await firstValueFrom(service.toggleSeleccionarTodas(listaId, true));

      const res = await firstValueFrom(service.toggleSeleccionarTodas(listaId, false));
      expect(res.data?.every(t => !t.selected && !t.completed)).toBeTrue();
    });
  });

  describe('eliminarTareasSeleccionadas()', () => {
    it('should remove only selected tasks and return count', async () => {
      const lista = await firstValueFrom(service.crearLista('Lista'));
      const listaId = lista.data!.id;
      const t1 = await firstValueFrom(service.crearTarea(listaId, 'Seleccionada'));
      await firstValueFrom(service.crearTarea(listaId, 'No seleccionada'));
      await firstValueFrom(service.toggleTareaCompleted(listaId, t1.data!.id));

      const res = await firstValueFrom(service.eliminarTareasSeleccionadas(listaId));
      expect(res.success).toBeTrue();
      expect(res.data).toBe(1);

      const tareas = await firstValueFrom(service.getTareas(listaId));
      expect(tareas.data?.length).toBe(1);
      expect(tareas.data?.[0].tarea).toBe('No seleccionada');
    });
  });

  describe('listas$ observable', () => {
    it('should emit updated list after creation', async () => {
      await firstValueFrom(service.crearLista('Reactiva'));
      const listas = await firstValueFrom(service.listas$);
      expect(listas.length).toBe(1);
      expect(listas[0].title).toBe('Reactiva');
    });

    it('should emit updated list after deletion', async () => {
      const res = await firstValueFrom(service.crearLista('A borrar'));
      await firstValueFrom(service.eliminarLista(res.data!.id));
      const listas = await firstValueFrom(service.listas$);
      expect(listas.length).toBe(0);
    });
  });
});
