import { ListaCompleta } from './lista-completa.model';

export interface ExportData {
  version: string;
  exportDate: string;
  listas: ListaCompleta[];
  metadata: {
    totalListas: number;
    totalTareas: number;
  };
}
