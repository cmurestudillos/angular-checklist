import { Lista } from './lista.model';
import { Tarea } from './tarea.model';

export interface ListaCompleta extends Lista {
  tareas: Tarea[];
}
