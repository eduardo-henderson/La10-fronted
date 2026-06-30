export enum TipoOcupacion {
  LIBRE = 'LIBRE',
  MEDIA = 'MEDIA',
  COMPLETA = 'COMPLETA',
}

export interface HorarioReservado {
  horario: string; // LocalDatetime
  tipoOcupacion: TipoOcupacion;
  esPropia?: boolean;
}

export interface EspacioReservado {
  idEspacio: number;
  nombre: string;
  horarios: HorarioReservado[];
}

export interface PromoSeleccionado {
  idPp: number;
  cantidad: number;
}

export interface NuevaReserva {
  idEspacio: number;
  inicio: string;
  duracionHoras?: number;
  media?: boolean;
  incluyeCancha?: boolean;
  comentario?: string;
  promos?: PromoSeleccionado[];
}
