import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EspacioService } from '../../../service/espacio';
import { ReservaService } from '../../../service/reserva';
import { AuthService } from '../../../service/auth.service';
import { Espacio, TipoEspacio } from '../../../models/espacio.model';
import { PromoPackService } from '../../../service/promo-pack.service';
import { PromoPack } from '../../../models/promo-pack.model';
import {
  EspacioReservado,
  HorarioReservado,
  TipoOcupacion,
  NuevaReserva,
} from '../../../models/ocupacion.model';

interface DiaHeader {
  nombre: string;
  numero: string;
  esHoy: boolean;
}

interface Seleccion {
  diaIndex: number; // Columna 0-6
  hora: number; // Hora 10-23
  estado: TipoOcupacion;
  fechaHoraIso: string;
  etiqueta: string;
}

@Component({
  selector: 'app-espacio-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './espacio-detalle.html',
  styleUrls: ['./espacio-detalle.css'],
})
export class EspacioDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private espacioService = inject(EspacioService);
  private reservaService = inject(ReservaService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private promoService = inject(PromoPackService);

  HORA_INICIO = 10;
  DURACION_SALON = 5;
  MAXIMO_SEMANAS_ADELANTE = 2; // Hasta donde va el calendario
  DIAS_LIMITE_RESERVA = this.MAXIMO_SEMANAS_ADELANTE * 7;

  TipoOcupacion = TipoOcupacion;
  TipoEspacio = TipoEspacio;

  horas: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  indicesDias = [0, 1, 2, 3, 4, 5, 6];

  idEspacio: number | null = null;
  espacio: Espacio | null = null;
  canchaAsociadaNombre = '';
  logueado = false;

  offsetSemana = 0;
  grilla: TipoOcupacion[][] = []; // La grilla [[Libre,Completa,..],[Libre,Media,..]] [fila][hora]
  dias: DiaHeader[] = []; // Los dias {nombre:'xx',numero'xx',esHoy:False,..}

  grillaCancha: TipoOcupacion[][] = [];

  grillaPropia: boolean[][] = [];

  seleccion: Seleccion | null = null;
  incluyeCancha = false;

  cargandoEspacio = false;
  cargandoGrilla = false;
  guardando = false;
  error = '';
  exito = '';

  comentario = '';

  hoverInicio: { diaIndex: number; hora: number } | null = null;

  packsDisponibles: PromoPack[] = [];
  packsElegidos: { [idPp: number]: number } = {};

  filtroPacks = '';

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    this.idEspacio = param ? Number(param) : null;
    this.logueado = this.auth.isAuthenticated();
    if (!this.idEspacio) {
      this.error = 'Espacio no valido.';
      return;
    }
    this.cargarEspacio();
  }

  private cargarEspacio(): void {
    this.cargandoEspacio = true;
    this.espacioService.obtenerEspacio(this.idEspacio!).subscribe({
      // Cargar el espacio
      next: (e) => {
        this.espacio = e; // Guarda el espacio
        this.cargandoEspacio = false;
        if (e.idCanchaAsociada != null) {
          this.espacioService.obtenerEspacio(e.idCanchaAsociada).subscribe({
            // Cargar la cancha asociada
            next: (c) => {
              this.canchaAsociadaNombre = c.nombre; // Guarda la canchaAsocia
              this.cdr.detectChanges();
            },
            error: () => {},
          });
        }
        this.cargarSemana(); // Ambos llaman a cargar semana
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoEspacio = false;
        this.error = 'No se pudo cargar el espacio. ' + (err.message || '');
        this.cdr.detectChanges();
      },
    });
  }

  cargarSemana(): void {
    this.cargandoGrilla = true;
    this.construirDias();
    const inicio = this.formatFecha(this.inicioSemana(this.offsetSemana));

    this.espacioService.obtenerOcupacionSemana(this.idEspacio!, inicio).subscribe({
      next: (data: EspacioReservado) => {
        this.grilla = this.horarioAGrilla(data.horarios || [], true);

        if (this.espacio?.idCanchaAsociada != null) {
          this.espacioService
            .obtenerOcupacionSemana(this.espacio.idCanchaAsociada, inicio)
            .subscribe({
              next: (dc) => {
                this.grillaCancha = this.horarioAGrilla(dc.horarios || [], false);
                this.cargandoGrilla = false;
                this.cdr.detectChanges();
              },
              error: () => {
                this.grillaCancha = [];
                this.cargandoGrilla = false;
                this.cdr.detectChanges();
              },
            });
        } else {
          this.cargandoGrilla = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.cargandoGrilla = false;
        this.error = 'No se pudo cargar la disponibilidad. ' + (err.message || '');
        this.cdr.detectChanges();
      },
    });
  }

  private horarioAGrilla(horarios: HorarioReservado[], guardarPropia = false): TipoOcupacion[][] {
    const g: TipoOcupacion[][] = [];
    const gp: boolean[][] = [];
    for (let f = 0; f < this.horas.length; f++) {
      g[f] = new Array(7).fill(TipoOcupacion.LIBRE);
      gp[f] = new Array(7).fill(false);
    }
    const base = this.inicioSemana(this.offsetSemana);
    for (const item of horarios) {
      const f = new Date(item.horario);
      const diaIndex = this.diffDias(base, f);
      const fila = f.getHours() - this.HORA_INICIO;
      if (diaIndex >= 0 && diaIndex < 7 && fila >= 0 && fila < this.horas.length) {
        g[fila][diaIndex] = item.tipoOcupacion;
        gp[fila][diaIndex] = !!item.esPropia;
      }
    }
    if (guardarPropia) this.grillaPropia = gp;
    return g;
  }

  private construirDias(): void {
    const base = this.inicioSemana(this.offsetSemana);
    const nombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.dias = [];
    for (let d = 0; d < 7; d++) {
      const f = new Date(base);
      f.setDate(base.getDate() + d);
      this.dias.push({
        nombre: nombres[d],
        numero: `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`,
        esHoy: f.getTime() === hoy.getTime(),
      });
    }
  }

  private cargarPacks(): void {
    this.promoService.disponibles().subscribe({
      next: (lista) => {
        this.packsDisponibles = lista;
        this.cdr.detectChanges();
      },
      error: () => {
        this.packsDisponibles = [];
      },
    });
  }

  private promosParaEnviar() {
    return Object.entries(this.packsElegidos)
      .map(([idPp, cantidad]) => ({ idPp: Number(idPp), cantidad: Number(cantidad) }))
      .filter((p) => p.cantidad > 0);
  }

  get canchaAsociadaOcupada(): boolean {
    if (!this.seleccion || !this.espacio?.idCanchaAsociada) return false;
    const fila = this.seleccion.hora - this.HORA_INICIO;
    const estado = this.grillaCancha[fila]?.[this.seleccion.diaIndex] ?? TipoOcupacion.LIBRE;
    return estado !== TipoOcupacion.LIBRE;
  }

  get packsFiltrados(): PromoPack[] {
    const q = this.filtroPacks.trim().toLowerCase();
    if (!q) return this.packsDisponibles;
    return this.packsDisponibles.filter((p) => p.nombre.toLowerCase().includes(q));
  }

  get puedeRetroceder(): boolean {
    return this.logueado && this.offsetSemana > 0;
  }
  get puedeAvanzar(): boolean {
    return this.logueado && this.offsetSemana < this.MAXIMO_SEMANAS_ADELANTE;
  }

  get duracionReserva(): number {
    return this.esSalon ? this.DURACION_SALON : 1;
  }

  get seCobraPasandoNoche(): boolean {
    if (!this.seleccion || !this.esSalon) return false;
    return (
      this.horasOcupablesDesde(this.seleccion.diaIndex, this.seleccion.hora) < this.DURACION_SALON
    );
  }

  get totalPacks(): number {
    return this.packsDisponibles.reduce((acc, p) => {
      const cant = this.packsElegidos[p.idPp] || 0;
      return acc + cant * p.precio;
    }, 0);
  }

  semanaAnterior(): void {
    if (this.puedeRetroceder) {
      this.offsetSemana--;
      this.cerrarPanel();
      this.cargarSemana();
    }
  }
  semanaSiguiente(): void {
    if (this.puedeAvanzar) {
      this.offsetSemana++;
      this.cerrarPanel();
      this.cargarSemana();
    }
  }
  hoy(): void {
    this.offsetSemana = 0;
    this.cerrarPanel();
    this.cargarSemana();
  }

  estadoCelda(diaIndex: number, hora: number): TipoOcupacion {
    return this.grilla[hora - this.HORA_INICIO]?.[diaIndex] ?? TipoOcupacion.LIBRE;
  }

  esReservable(diaIndex: number, hora: number): boolean {
    return this.logueado && this.estaDisponible(diaIndex, hora);
  }

  claseCelda(diaIndex: number, hora: number): string {
    const estado = this.estadoCelda(diaIndex, hora);

    if (estado !== TipoOcupacion.LIBRE && this.esPropia(diaIndex, hora)) {
      return 'celda-propia';
    }

    if (estado === TipoOcupacion.COMPLETA) return 'celda-completa';
    if (estado === TipoOcupacion.MEDIA) return 'celda-media';

    const base = this.estaDisponible(diaIndex, hora) ? 'celda-libre' : 'celda-bloqueada';
    if (this.esSalon && this.tieneCanchaAsociada && this.canchaOcupadaEn(diaIndex, hora)) {
      return base + ' cancha-ocupada';
    }
    return base;
  }

  esSeleccionada(diaIndex: number, hora: number): boolean {
    return this.seleccion?.diaIndex === diaIndex && this.seleccion?.hora === hora;
  }

  esPropia(diaIndex: number, hora: number): boolean {
    return this.grillaPropia[hora - this.HORA_INICIO]?.[diaIndex] ?? false;
  }

  onCeldaClick(diaIndex: number, hora: number): void {
    this.error = '';
    if (!this.logueado) {
      this.error = 'Iniciá sesión para reservar.';
      return;
    }
    if (!this.esReservable(diaIndex, hora)) return;
    const inicio = this.fechaDeCelda(diaIndex, hora);
    this.seleccion = {
      diaIndex,
      hora,
      estado: this.estadoCelda(diaIndex, hora),
      fechaHoraIso: this.isoLocal(inicio),
      etiqueta: `${this.dias[diaIndex].nombre} ${String(hora).padStart(2, '0')}:00`,
    };
    this.packsElegidos = {};
    this.cargarPacks();
    this.filtroPacks = '';
    this.incluyeCancha = this.esSalon && this.tieneCanchaAsociada;
    this.comentario = '';
  }

  onCeldaHover(diaIndex: number, hora: number): void {
    if (!this.esSalon) return;
    if (!this.esReservable(diaIndex, hora)) {
      this.hoverInicio = null;
      return;
    }
    this.hoverInicio = { diaIndex, hora };
  }

  onCeldaLeave(): void {
    this.hoverInicio = null;
  }

  cerrarPanel(): void {
    this.seleccion = null;
    this.error = '';
    this.comentario = '';
  }

  estaEnHover(diaIndex: number, hora: number): boolean {
    if (!this.hoverInicio || !this.esSalon) return false;
    if (this.hoverInicio.diaIndex !== diaIndex) return false;
    const inicio = this.hoverInicio.hora;
    const fin = inicio + this.horasOcupablesDesde(this.hoverInicio.diaIndex, inicio);
    return hora >= inicio && hora < fin;
  }

  horasOcupablesDesde(diaIndex: number, hora: number): number {
    const finSupuesto = hora + this.duracionReserva;
    const finReal = Math.min(finSupuesto, 24);
    return finReal - hora;
  }

  cambiarCantidadPack(idPp: number, cantidad: number, stock: number): void {
    let c = Number(cantidad) || 0;
    if (c < 0) c = 0;
    if (c > stock) c = stock;
    this.packsElegidos[idPp] = c;
  }

  estaDisponible(diaIndex: number, hora: number): boolean {
    if (!this.espacio || !this.espacio.habilitado) return false;

    const inicio = this.fechaDeCelda(diaIndex, hora);
    const ahora = new Date();
    if (inicio.getTime() < ahora.getTime()) return false;

    const limite = new Date(ahora);
    limite.setDate(ahora.getDate() + this.DIAS_LIMITE_RESERVA);
    if (inicio.getTime() > limite.getTime()) return false;

    if (this.espacio.tipo === TipoEspacio.CANCHA) {
      const estado = this.estadoCelda(diaIndex, hora);
      return estado === TipoOcupacion.LIBRE || estado === TipoOcupacion.MEDIA;
    }

    const horasOcupables = this.horasOcupablesDesde(diaIndex, hora);
    for (let h = hora; h < hora + horasOcupables; h++) {
      if (this.estadoCelda(diaIndex, h) !== TipoOcupacion.LIBRE) return false;
    }
    return true;
  }

  private canchaOcupadaEn(diaIndex: number, hora: number): boolean {
    const fila = hora - this.HORA_INICIO;
    const estado = this.grillaCancha[fila]?.[diaIndex] ?? TipoOcupacion.LIBRE;
    return estado !== TipoOcupacion.LIBRE;
  }

  reservarCompleta(): void {
    this.enviar({ media: false });
  }
  reservarMedia(): void {
    this.enviar({ media: true });
  }
  reservarSalon(): void {
    this.enviar({ media: false, incluyeCancha: this.incluyeCancha });
  }

  private enviar(opts: Partial<NuevaReserva>): void {
    if (!this.seleccion || !this.idEspacio) return;
    const payload: NuevaReserva = {
      idEspacio: this.idEspacio,
      inicio: this.seleccion.fechaHoraIso,
      duracionHoras: this.duracionReserva,
      comentario: this.comentario.trim() || undefined,
      promos: this.promosParaEnviar(),
      ...opts,
    };
    this.guardando = true;
    this.error = '';
    this.reservaService.crearReserva(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.exito = 'Reserva creada correctamente.';
        this.cerrarPanel();
        this.cargarSemana();
        setTimeout(() => {
          this.exito = '';
          this.cdr.detectChanges();
        }, 2500);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardando = false;
        this.error = err?.message || 'No se pudo crear la reserva.';
        this.cdr.detectChanges();
      },
    });
  }

  get esCancha(): boolean {
    return this.espacio?.tipo === TipoEspacio.CANCHA;
  }
  get esSalon(): boolean {
    return this.espacio?.tipo === TipoEspacio.SALON;
  }
  get seleccionEsMedia(): boolean {
    return this.seleccion?.estado === TipoOcupacion.MEDIA;
  }
  get permiteMedia(): boolean {
    return !!this.espacio?.permiteMediaReserva;
  }
  get tieneCanchaAsociada(): boolean {
    return this.espacio?.idCanchaAsociada != null;
  }
  get etiquetaTipo(): string {
    if (!this.espacio) return '';
    return this.espacio.tipo === TipoEspacio.CANCHA ? 'Cancha' : 'Salón';
  }
  get precioCompleta(): number {
    return this.espacio?.precioBase ?? 0;
  }
  get precioMedia(): number {
    return Math.round((this.espacio?.precioBase ?? 0) / 2);
  }
  get precioSalon(): number {
    return this.espacio?.precioBase ?? 0;
  }
  get salonFinHora(): string {
    if (!this.seleccion) return '';
    const horasReales = this.horasOcupablesDesde(this.seleccion.diaIndex, this.seleccion.hora);
    const finHora = this.seleccion.hora + horasReales;
    return String(finHora % 24).padStart(2, '0') + ':00';
  }
  get rangoSemana(): string {
    const ini = this.inicioSemana(this.offsetSemana);
    const fin = new Date(ini);
    fin.setDate(ini.getDate() + 6);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(ini)} al ${fmt(fin)}`;
  }

  get hayPacks(): boolean {
    return this.totalPacks > 0;
  }
  get totalCompletaConPacks(): number {
    return this.precioCompleta + this.totalPacks;
  }
  get totalMediaConPacks(): number {
    return this.precioMedia + this.totalPacks;
  }
  get totalSalonConPacks(): number {
    return this.precioSalon + this.totalPacks;
  }

  private lunesDeEstaSemana(): Date {
    const hoy = new Date();
    const dia = hoy.getDay();
    const desplazamiento = dia === 0 ? -6 : 1 - dia;
    hoy.setDate(hoy.getDate() + desplazamiento);
    hoy.setHours(0, 0, 0, 0);
    return hoy;
  }
  private inicioSemana(offset: number): Date {
    const lunes = this.lunesDeEstaSemana();
    lunes.setDate(lunes.getDate() + offset * 7);
    return lunes;
  }
  private fechaDeCelda(diaIndex: number, hora: number): Date {
    const base = this.inicioSemana(this.offsetSemana);
    const f = new Date(base);
    f.setDate(base.getDate() + diaIndex);
    f.setHours(hora, 0, 0, 0);
    return f;
  }
  private isoLocal(f: Date): string {
    return (
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-` +
      `${String(f.getDate()).padStart(2, '0')}T${String(f.getHours()).padStart(2, '0')}:00:00`
    );
  }
  private formatFecha(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private diffDias(a: Date, b: Date): number {
    const x = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const y = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((y - x) / 86400000);
  }
}
