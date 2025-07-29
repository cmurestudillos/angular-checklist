export interface Tarea {
  id: string;
  tarea: string;
  completed: boolean;
  selected: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
