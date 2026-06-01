export interface HorarioDisponible {
  horario: string;
  necesitaRival: boolean;
}

export interface EspacioDisponibilidad {
  idEspacio: number;
  nombre: string;
  horariosDisponibles: HorarioDisponible[];
}