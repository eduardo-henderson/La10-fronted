export interface Reserva {
  idReserva?: number;
  idEspacio: number;
  fecha: string; // formato YYYY-MM-DD
  horaInicio: string; // formato HH:mm
  duracionHoras: number;
  conMediaReserva: boolean;
}
