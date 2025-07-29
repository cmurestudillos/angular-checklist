export const ERROR_MESSAGES = {
  LISTA_EXISTS: 'La lista ya existe',
  LISTA_NOT_FOUND: 'La lista no fue encontrada',
  TAREA_EXISTS: 'La tarea ya existe',
  TAREA_NOT_FOUND: 'La tarea no fue encontrada',
  STORAGE_ERROR: 'Error al acceder al almacenamiento',
  INVALID_DATA: 'Datos inválidos',
} as const;

export const SUCCESS_MESSAGES = {
  LISTA_CREATED: 'Lista creada correctamente',
  LISTA_UPDATED: 'Lista actualizada correctamente',
  LISTA_DELETED: 'Lista eliminada correctamente',
  TAREA_CREATED: 'Tarea creada correctamente',
  TAREA_UPDATED: 'Tarea actualizada correctamente',
  TAREA_DELETED: 'Tarea eliminada correctamente',
  TAREAS_DELETED: 'Tareas eliminadas correctamente',
} as const;
