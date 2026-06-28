import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Espacio, TipoEspacio } from '../../../models/espacio.model';
import { AuthService } from '../../../service/auth.service';
import { EspacioService } from '../../../service/espacio';
import { CloudinaryService } from '../../../service/cloudinary.service';

@Component({
  selector: 'app-registro-espacio',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-espacio.html',
  styleUrls: ['./registro-espacio.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroEspacioComponent implements OnInit {
  private readonly espacioService = inject(EspacioService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly cloudinary = inject(CloudinaryService); // cloud

  espacio: Espacio = this.createDefaultEspacio();
  listaEspacios: Espacio[] = [];
  isLoadingEspacios = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  editMode = false;

  subiendoImagen = false; // cloud

  mostrarModalConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  tipoAccion: 'inhabilitar' | 'habilitar' = 'inhabilitar';
  espacioActual: Espacio | null = null;

  ngOnInit(): void {
    this.cargarEspacios();
  }

  createDefaultEspacio(): Espacio {
    return {
      nombre: '',
      capacidad: 1,
      habilitado: true,
      precioBase: 0,
      permiteMediaReserva: false,
      tipo: TipoEspacio.CANCHA,
      canchaAsociada: null,
      imagenUrl: null,
    };
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  irADisponibilidad(): void {
    this.router.navigate(['/disponibilidad']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  volver(): void {
    this.location.back();
  }

  cargarEspacios(): void {
    this.isLoadingEspacios = true;
    this.errorMessage = '';

    this.espacioService
      .getEspacios()
      .pipe(
        finalize(() => {
          this.isLoadingEspacios = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (espacios) => {
          this.listaEspacios = [...espacios].sort(
            (a, b) => (b.idEspacio ?? 0) - (a.idEspacio ?? 0),
          );
        },
        error: () => {
          this.errorMessage = 'Error al cargar espacios';
        },
      });
  }

  guardar(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ =
      this.editMode && this.espacio.idEspacio
        ? this.espacioService.actualizarEspacio(this.espacio)
        : this.espacioService.registrarEspacio(this.espacio);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = this.editMode
            ? 'Espacio actualizado correctamente'
            : 'Espacio registrado correctamente';
          this.editMode = false;
          this.espacio = this.createDefaultEspacio();
          form.resetForm(this.espacio);
          this.cargarEspacios();
        },
        error: () => {
          this.errorMessage = this.editMode
            ? 'Error al actualizar espacio'
            : 'Error al registrar espacio';
        },
      });
  }

  editarEspacio(espacio: Espacio): void {
    this.editMode = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.espacio = {
      ...espacio,
      canchaAsociada: espacio.canchaAsociada ?? null,
    };
    this.cd.markForCheck();
  }

  cancelarEdicion(): void {
    this.editMode = false;
    this.espacio = this.createDefaultEspacio();
    this.errorMessage = '';
    this.successMessage = '';
    this.cd.markForCheck();
  }

  trackByEspacioId(index: number, espacio: Espacio): number {
    return espacio.idEspacio ?? index;
  }

  inhabilitarEspacio(espacio: Espacio): void {
    this.mostrarConfirmacion(espacio, 'inhabilitar');
  }

  habilitarEspacio(espacio: Espacio): void {
    this.mostrarConfirmacion(espacio, 'habilitar');
  }

  mostrarConfirmacion(espacio: Espacio, accion: 'habilitar' | 'inhabilitar'): void {
    this.espacioActual = espacio;
    this.tipoAccion = accion;
    this.tituloConfirmacion = accion === 'habilitar' ? 'Habilitar espacio' : 'Inhabilitar espacio';
    this.mensajeConfirmacion =
      accion === 'habilitar'
        ? '¿Desea habilitar este espacio?'
        : '¿Desea inhabilitar este espacio?';
    this.mostrarModalConfirmacion = true;
    this.cd.markForCheck();
  }

  cancelarAccion(): void {
    this.mostrarModalConfirmacion = false;
    this.espacioActual = null;
    this.cd.markForCheck();
  }

  confirmarAccion(): void {
    if (!this.espacioActual || this.isSaving) {
      return;
    }

    const espacio = this.espacioActual;
    const habilitado = this.tipoAccion === 'habilitar';

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = habilitado
      ? this.espacioService.actualizarEspacio({ ...espacio, habilitado: true })
      : this.espacioService.inhabilitarEspacio(espacio);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = habilitado
            ? 'Espacio habilitado correctamente'
            : 'Espacio inhabilitado correctamente';
          this.mostrarModalConfirmacion = false;
          this.espacioActual = null;
          this.cargarEspacios();
        },
        error: () => {
          this.errorMessage = habilitado
            ? 'Error al habilitar espacio'
            : 'Error al inhabilitar espacio';
          this.mostrarModalConfirmacion = false;
          this.espacioActual = null;
        },
      });
  }

  // Imagen
  onArchivoSeleccionado(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];

    if (!archivo.type.startsWith('image/')) {
      this.errorMessage = 'El archivo debe ser una imagen.';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen no puede superar los 5MB.';
      return;
    }

    this.subiendoImagen = true;
    this.errorMessage = '';

    this.cloudinary
      .subirImagen(archivo)
      .pipe(
        finalize(() => {
          this.subiendoImagen = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (url) => {
          this.espacio.imagenUrl = url;
        },
        error: () => {
          this.errorMessage = 'No se pudo subir la imagen.';
        },
      });
  }

  quitarImagen(): void {
    this.espacio.imagenUrl = null;
    this.cd.markForCheck();
  }

  // Sacar las agrupaciones incorrectas
  onTipoChange(): void {
    if (this.espacio.tipo === TipoEspacio.CANCHA) {
      // Una cancha no puede tener cancha asociada
      this.espacio.canchaAsociada = null;
    } else {
      // un salon no permite media reserva
      this.espacio.permiteMediaReserva = false;
    }
    this.cd.markForCheck();
  }

  get esCancha(): boolean {
    return this.espacio.tipo === TipoEspacio.CANCHA;
  }

  get esSalon(): boolean {
    return this.espacio.tipo === TipoEspacio.SALON;
  }

  // solo las canchas pueden ser asociadas a un salon
  get canchasDisponibles(): Espacio[] {
    return this.listaEspacios.filter(
      (e) => e.tipo === TipoEspacio.CANCHA && e.idEspacio !== this.espacio.idEspacio,
    );
  }
}
