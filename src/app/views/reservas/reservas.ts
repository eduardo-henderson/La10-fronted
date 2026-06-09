import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Espacio } from '../../models/espacio.model';
import { Reserva } from '../../models/reserva.model';
import { EspacioService } from '../../service/espacio';
import { ReservaService } from '../../service/reserva';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css']
})
export class ReservasComponent implements OnInit {
  goHome(): void {
    this.router.navigate(['/home']);
  }
  reserva: Reserva = this.createDefaultReserva();
  listaEspacios: Espacio[] = [];
  reservas: Reserva[] = [];
  disponibilidad: any[] = [];
  isLoadingEspacios: boolean = false;
  isLoadingReservas: boolean = false;
  isLoadingDisponibilidad: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarEspacios();
    this.cargarReservas();
    this.cargarDisponibilidad();

    // Preseleccionar espacio si viene en query params (desde registro de espacio)
    this.route.queryParams.subscribe(params => {
      const id = params['idEspacio'] ? Number(params['idEspacio']) : null;
      if (id) {
        this.reserva.idEspacio = id;
      }
    });
  }

  cargarEspacios(): void {
    this.isLoadingEspacios = true;
    this.errorMessage = '';

    this.espacioService.getEspacios().subscribe({
      next: (data: any) => {
        // Normalizar distintas formas de respuesta y asegurar que cada objeto tenga `idEspacio` y `nombre`
        const rawList: any[] = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : data?.espacios && Array.isArray(data.espacios)
          ? data.espacios
          : [];

        console.debug('Espacios - respuesta raw:', data);

        this.listaEspacios = rawList.map((item: any) => ({
          ...item,
          idEspacio: item.idEspacio ?? item.id ?? item.id_espacio ?? 0,
          nombre: item.nombre ?? item.name ?? `Espacio #${item.idEspacio ?? item.id ?? 'unknown'}`,
        }));

        if (this.listaEspacios.length === 0) {
          this.errorMessage = 'No se encontraron espacios (respuesta vacía del servidor).';
        }
        this.isLoadingEspacios = false;
      },
      error: (err) => {
        this.isLoadingEspacios = false;
        this.errorMessage = 'No se pudieron cargar los espacios: ' + err.message;
        console.error('Error al cargar espacios para reservas:', err);
      }
    });
  }

  cargarReservas(): void {
    this.isLoadingReservas = true;
    this.errorMessage = '';

    this.reservaService.listarReservas().subscribe({
      next: (data: any) => {
        this.reservas = data;
        this.isLoadingReservas = false;
      },
      error: (err) => {
        this.isLoadingReservas = false;
        this.errorMessage = 'No se pudieron cargar las reservas: ' + err.message;
        console.error('Error al cargar reservas:', err);
      }
    });
  }

  cargarDisponibilidad(): void {
    this.isLoadingDisponibilidad = true;
    this.errorMessage = '';
    this.reservaService.disponibilidad().subscribe({
      next: (data: any) => {
        this.disponibilidad = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : data?.disponibilidad && Array.isArray(data.disponibilidad)
          ? data.disponibilidad
          : [data];
        this.isLoadingDisponibilidad = false;
      },
      error: (err) => {
        this.isLoadingDisponibilidad = false;
        console.error('Error al cargar disponibilidad:', err);
      }
    });
  }

  private getSpaceId(item: any): number {
    return item?.espacio?.idEspacio ?? item.idEspacio ?? item?.espacio?.id ?? item.id ?? 0;
  }

  getAvailabilityName(item: any): string {
    return item?.espacio?.nombre ?? item.nombre ?? item.name ?? 'Espacio desconocido';
  }

  getAvailabilityType(item: any): string {
    return item?.espacio?.tipo ?? item.tipo ?? '';
  }

  getAssociatedSpaceName(item: any): string | null {
    return item?.espacio?.canchaAsociada?.nombre ?? item?.canchaAsociada?.nombre ?? null;
  }

  hasHorarioOptions(item: any): boolean {
    return this.getHorarioOptions(item).length > 0;
  }

  getHorarioOptions(item: any): string[] {
    if (Array.isArray(item?.horarios)) {
      return item.horarios;
    }

    if (typeof item?.horarios === 'string') {
      return item.horarios.split(/[,;]\s*/).filter((hora: string) => hora.trim());
    }

    if (Array.isArray(item?.horasDisponibles)) {
      return item.horasDisponibles;
    }

    if (typeof item?.horaInicio === 'string') {
      return [item.horaInicio];
    }

    return [];
  }

  seleccionarHorario(item: any, horario: string): void {
    const espacioId = this.getSpaceId(item);
    if (espacioId) {
      this.reserva.idEspacio = espacioId;
    }

    if (item?.fecha) {
      this.reserva.fecha = item.fecha;
    }

    this.reserva.horaInicio = horario;
    this.errorMessage = '';
    this.successMessage = '';
  }

  getAvailabilityNote(item: any): string | null {
    if (typeof item?.disponible === 'boolean') {
      return item.disponible ? 'Disponible' : 'No disponible';
    }
    return null;
  }

  guardarReserva(form: NgForm): void {
    console.debug('Iniciando reserva:', this.reserva);
    if (!this.reserva.idEspacio || this.reserva.idEspacio === 0) {
      this.errorMessage = 'Selecciona un espacio para reservar.';
      return;
    }

    if (!this.reserva.fecha) {
      this.errorMessage = 'Selecciona una fecha para la reserva.';
      return;
    }

    if (!this.reserva.horaInicio) {
      this.errorMessage = 'Selecciona una hora de inicio.';
      return;
    }

    if (this.reserva.duracionHoras <= 0) {
      this.errorMessage = 'La duración debe ser mayor a 0 horas.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservaService.reservar(this.reserva).subscribe({
      next: (resp) => {
        console.debug('Respuesta reservar:', resp);
        this.isSaving = false;
        this.successMessage = 'Reserva creada correctamente.';
        this.limpiarFormulario();
        form.resetForm(this.reserva);
        this.cargarReservas();
        setTimeout(() => {
          this.successMessage = '';
        }, 2500);
      },
      error: (err) => {
        console.error('Error al reservar:', err);
        this.isSaving = false;
        // Mostrar mensaje más amigable según tipo
        if (err?.name === 'TimeoutError') {
          this.errorMessage = 'La solicitud tardó demasiado. Intenta de nuevo.';
        } else {
          this.errorMessage = 'Error al crear la reserva: ' + (err.message || err);
        }
      }
    });
  }

  getEspacioNombre(idEspacio: number): string {
    const espacio = this.listaEspacios.find(item =>
      item.idEspacio === idEspacio || (item as any).id === idEspacio
    );
    return espacio ? espacio.nombre : 'Espacio desconocido';
  }

  private createDefaultReserva(): Reserva {
    return {
      idEspacio: 0,
      fecha: new Date().toISOString().slice(0, 10),
      horaInicio: '08:00',
      duracionHoras: 1,
      conMediaReserva: false
    };
  }

  limpiarFormulario(): void {
    this.reserva = this.createDefaultReserva();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
