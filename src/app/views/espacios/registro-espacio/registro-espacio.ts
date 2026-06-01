import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Espacio, TipoEspacio } from '../../../models/espacio.model';
import { EspacioService } from '../../../service/espacio';
import { AuthService } from '../../../service/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-registro-espacio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-espacio.html',
  styleUrls: ['./registro-espacio.css']
})
export class RegistroEspacioComponent implements OnInit {

  espacio: Espacio = this.createDefaultEspacio();

  listaEspacios: Espacio[] = [];
  isLoadingEspacios: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private espacioService: EspacioService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  reservarEspacio(espacio: Espacio): void {
    const id = (espacio as any).idEspacio ?? (espacio as any).id ?? 0;
    if (!id) {
      this.errorMessage = 'No se puede reservar este espacio: ID desconocido.';
      return;
    }

    // Navegar a la vista de reservas pasando el idEspacio como query param
    this.router.navigate(['/reservas'], { queryParams: { idEspacio: id } });
  }

  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarEspaciosExistentes();
  }

  cargarEspaciosExistentes(): void {
    this.isLoadingEspacios = true;
    this.errorMessage = '';

    this.espacioService.getEspacios()
      .pipe(finalize(() => {
        this.isLoadingEspacios = false;
      }))
      .subscribe({
       next: (data) => {
          this.listaEspacios = data;
          //resolver relaciones (CLAVE)
          this.listaEspacios.forEach(e => {
            const id = (e as any).idCanchaAsociada;
            if (id) {
              e.canchaAsociada = this.listaEspacios.find(
                x => x.idEspacio === id
              ) || null;
            }
          });
          console.log('LISTA CON RELACIONES:', this.listaEspacios);
          this.cd.detectChanges();
        },
        error: (err) => {
          // Manejar error de autenticación
          if (err.status === 401) {
            this.errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = 'Error al recuperar espacios: ' + err.message;
          }
          console.error('Error al recuperar espacios:', err);
        }
      });
  }

  guardar(form: NgForm): void {
    // Validaciones básicas
    if (!this.espacio.nombre.trim()) {
      this.errorMessage = 'El nombre del espacio es requerido';
      return;
    }

    if (this.espacio.capacidad <= 0) {
      this.errorMessage = 'La capacidad debe ser mayor a 0';
      return;
    }

    if (this.espacio.precioBase < 0) {
      this.errorMessage = 'El precio base no puede ser negativo';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const espacio = { ...this.espacio };

    // Si no hay cancha asociada, no enviar null
    if (espacio.canchaAsociada === null || espacio.canchaAsociada === undefined) {
      delete (espacio as any).canchaAsociada;
    }

    this.espacioService.registrarEspacio(espacio)
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: (response) => {
          this.isSaving = false;
          this.successMessage = 'Espacio guardado exitosamente';
          // recargar lista PRIMERO
          this.cargarEspaciosExistentes();
          // resetear formulario después
          this.limpiarFormulario();
          form.resetForm(this.espacio);

          setTimeout(() => {
            this.successMessage = '';
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          // Manejar error de autenticación
          if (err.message.includes('401') || err.message.includes('No autenticado')) {
            this.errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = 'Error al guardar el espacio: ' + err.message;
          }
          console.error('Error al guardar el espacio:', err);
        }
      });
  }

  private createDefaultEspacio(): Espacio {
    return {
      nombre: '',
      capacidad: 1,
      habilitado: true,
      precioBase: 0,
      permiteMediaReserva: false,
      tipo: TipoEspacio.CANCHA,
      canchaAsociada: null
    };
  }

  limpiarFormulario(): void {
    this.espacio = this.createDefaultEspacio();
  }

  /**
   * Cierra sesión y redirige al login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

