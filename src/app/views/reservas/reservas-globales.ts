import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservaService } from '../../service/reserva';
import { EspacioService } from '../../service/espacio';
import { Espacio } from '../../models/espacio.model';

@Component({
  selector: 'app-reservas-globales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reservas-globales.html',
  styleUrls: ['./reservas.css'] //usando tu reservas.css unificado
})
export class ReservasGlobalesComponent implements OnInit {
  reservasGlobales: any[] = [];
  listaEspacios: Espacio[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private reservaService: ReservaService,
    private espacioService: EspacioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEspacios();
    this.buscarReservas();
  }

  cargarEspacios(): void {
    this.espacioService.getEspacios().subscribe({
      next: (data: any) => {
        this.listaEspacios = Array.isArray(data) ? data : data?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar espacios:', err)
    });
  }

  buscarReservas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reservaService.obtenerReservasActivas().subscribe({
      next: (resp: any) => {
        // El JSON viene con { status: "OK", data: [...] }
        this.reservasGlobales = resp && Array.isArray(resp.data) ? resp.data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al consultar las reservas globales.';
        this.cdr.detectChanges();
      }
    });
  }

  //CANCELAR RESERVA
  isModalOpen = false;
  motivoCancelacion = '';
  itemACancelar: any = null;

  // 2. AGREGA ESTE NUEVO MÉTODO PARA ABRIR EL MODAL
  abrirModalCancelacion(item: any): void {
    this.itemACancelar = item;
    this.motivoCancelacion = ''; 
    this.isModalOpen = true;
  }

  // 3. REEMPLAZA TU FUNCIÓN CANCELAR RESERVA ACTUAL POR ESTA
  cancelarReserva(): void {
    if (!this.itemACancelar) return;

    this.isModalOpen = false; 
    this.cdr.detectChanges(); // Forzamos el cierre visual rápido

    this.isLoading = true;
    this.errorMessage = '';   
    this.successMessage = '';  
    this.cdr.detectChanges();

    const reservaDto = {
      ...this.itemACancelar,
      motivoCanc: this.motivoCancelacion.trim() === '' ? 'Cancelado por el Administrador' : this.motivoCancelacion
    };

    this.reservaService.cancelarReserva(reservaDto).subscribe({
      next: (resp: any) => {
        if (resp && (resp.status === 'OK' || resp.type === 'OK')) {
          this.successMessage = '¡Reserva cancelada con éxito!';
          this.buscarReservas(); // Ejecuta tu refresco original
        } else {
          this.errorMessage = resp?.message || 'No se pudo cancelar la reserva.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error de red al intentar cancelar.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.itemACancelar = null;
      }
    });
  }

  getEspacioNombre(idEspacio: number): string {
    const espacio = this.listaEspacios.find(item => item.idEspacio === idEspacio);
    return espacio ? espacio.nombre : `Espacio #${idEspacio}`;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}