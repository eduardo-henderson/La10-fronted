export enum TipoOcupacion {
  LIBRE = 'LIBRE',
  MEDIA = 'MEDIA',
  COMPLETA = 'COMPLETA',
}

export interface HorarioReservado {
  horario: string; // LocalDatetime
  tipoOcupacion: TipoOcupacion;
}

export interface EspacioReservado {
  idEspacio: number;
  nombre: string;
  horarios: HorarioReservado[];
}

export interface NuevaReserva {
  idEspacio: number;
  inicio: string; // LocalDateTime
  duracionHoras?: number;
  media?: boolean;
  incluyeCancha?: boolean;
}
