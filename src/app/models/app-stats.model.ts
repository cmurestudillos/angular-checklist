export interface AppStats {
  totalListas: number;
  totalTareas: number;
  tareasCompletadas: number;
  tareasActivas: number;
  completionRate: number;
  listaConMasTareas: string | null;
  ultimaActividad: Date | null;
  tiempoUsoTotal: number; // en minutos
}
