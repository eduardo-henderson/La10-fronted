import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservaService } from '../../service/reserva';
import { EspacioService } from '../../service/espacio';
import { Espacio } from '../../models/espacio.model';

@Component({
  selector: 'app-reservas-globales',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  cancelarReserva(item: any): void {
    const motivo = window.prompt(
      '¿Estás seguro de que deseas cancelar esta reserva?\nIngresa el motivo (opcional):'
    );

    if (motivo === null) return; 

    this.isLoading = true;
    this.errorMessage = '';   //limpiamos mensajes anteriores
    this.successMessage = '';  //limpiamos mensajes anteriores
    this.cdr.detectChanges();

    const reservaDto = {
      ...item,
      motivoCanc: motivo.trim() === '' ? 'Cancelado por el Administrador' : motivo
    };

    this.reservaService.cancelarReserva(reservaDto).subscribe({
      next: (resp: any) => {
        if (resp && (resp.status === 'OK' || resp.type === 'OK')) {
          //en vez de alert(), guardar el mensaje en la variable
          this.successMessage = '¡Reserva cancelada con éxito!';
          this.buscarReservas(); // O this.cargarReservas() segun el componente
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