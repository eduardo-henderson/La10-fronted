export enum TipoEspacio {
  CANCHA = 'CANCHA',
  SALON = 'SALON',
}

export interface Espacio {
  idEspacio?: number;
  nombre: string;
  capacidad: number;
  habilitado: boolean;
  precioBase: number;
  permiteMediaReserva: boolean;
  tipo: TipoEspacio;
  canchaAsociada?: Espacio | null;
  idCanchaAsociada?: number | null;
  imagenUrl?: string | null;
}
