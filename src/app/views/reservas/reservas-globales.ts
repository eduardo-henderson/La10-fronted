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

  //paginacion para Reservas-globales
  paginaActual: number = 0;
  tamanioPagina: number = 5;
  totalPaginas: number = 0;
  esPrimeraPagina: boolean = true;
  esUltimaPagina: boolean = true;
  totalElementos: number = 0;
  elementosPagina: number = 0;
  // variables de estado para pagos
  isPagoModalOpen: boolean = false;
  reservaParaPago: any = null;
  pagoMonto: number | null = null;
  pagoDetalle: string = '';
  pagosDeLaReserva: any[] = [];

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

  // abrir modal y buscar historial
  abrirModalPago(reserva: any): void {
    this.reservaParaPago = reserva;
    this.pagoMonto = null;
    this.pagoDetalle = '';
    this.pagosDeLaReserva = [];
    this.isPagoModalOpen = true;
    
    // llamamos al back para traer los dtos de los pagos viejos
    this.reservaService.obtenerPagosReserva(reserva.idReserva).subscribe({
      next: (resp: any) => {
        if (resp && resp.status === 'OK') {
          this.pagosDeLaReserva = resp.data || [];
          this.cdr.detectChanges();//para que angular refresque el html
        }
      }
    });
  }

  // cerrar modal
  cerrarModalPago(): void {
    this.isPagoModalOpen = false;
    this.reservaParaPago = null;
    this.pagosDeLaReserva = [];
  }

  // validar y guardar pago nuevo
  guardarPago(): void {
    if (!this.reservaParaPago || !this.pagoMonto || this.pagoMonto <= 0) {
      this.errorMessage = 'debes ingresar un monto valido';
      return;
    }

    this.isPagoModalOpen = false;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const pagoDto = {
      idReserva: this.reservaParaPago.idReserva,
      monto: this.pagoMonto,
      detalle: this.pagoDetalle.trim() === '' ? 'pago manual' : this.pagoDetalle
    };

    this.reservaService.registrarPagoAdmin(pagoDto).subscribe({
      next: (resp: any) => {
        if (resp && resp.status === 'OK') {
          this.successMessage = '¡Pago registrado exitosamente!';
          this.buscarReservas(); // recarga la grilla general
        } else {
          this.errorMessage = resp?.data || 'no se pudo registrar el pago';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'error de red al registrar pago';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.reservaParaPago = null;
      }
    });
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

    this.reservaService.obtenerReservasActivas(this.paginaActual, this.tamanioPagina).subscribe({
      next: (resp: any) => {
        if (resp && resp.data && Array.isArray(resp.data.content)) {
          this.reservasGlobales = resp.data.content;
          
          // Capturamos los metadatos de paginación globales
          this.totalPaginas = resp.data.totalPages ?? 1;
          this.esPrimeraPagina = resp.data.first ?? true;
          this.esUltimaPagina = resp.data.last ?? true;

          // NUEVO: Guardamos los totales del servidor
          this.totalElementos = resp.data.totalElements ?? 0;
          this.elementosPagina = resp.data.numberOfElements ?? 0;
        } else {
          this.reservasGlobales = [];
          this.totalPaginas = 0;
          this.totalElementos = 0;
          this.elementosPagina = 0;
          this.esPrimeraPagina = true;
          this.esUltimaPagina = true;
        }
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

  //navegación de paginas globales
  paginaAnterior(): void {
    if (!this.esPrimeraPagina) {
      this.paginaActual--;
      this.buscarReservas();
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.paginaActual++;
      this.buscarReservas();
    }
  }

  // CALCULO DINAMICO DEL RANGO INICIAL (Ej: 1, 6, 11...)
  get desdeElemento(): number {
    if (this.totalElementos === 0) return 0;
    return (this.paginaActual * this.tamanioPagina) + 1;
  }

  // CALCULO DINAMICO DEL RANGO FINAL (Ej: 5, 10, 15...)
  get hastaElemento(): number {
    return (this.paginaActual * this.tamanioPagina) + this.elementosPagina;
  }

  //CANCELAR RESERVA
  isModalOpen = false;
  motivoCancelacion = '';
  itemACancelar: any = null;

  abrirModalCancelacion(item: any): void {
    this.itemACancelar = item;
    this.motivoCancelacion = ''; 
    this.isModalOpen = true;
  }

  cancelarReserva(): void {
    if (!this.itemACancelar) return;

    this.isModalOpen = false; 
    this.cdr.detectChanges(); // forzamos el cierre visual rapido

    this.isLoading = true;
    this.errorMessage = '';   
    this.successMessage = '';  
    this.cdr.detectChanges();

    const reservaDto = {
      ...this.itemACancelar,
      motivoCanc: this.motivoCancelacion.trim() === '' ? 'Cancelado por el Administrador' : `Cancelado por el Administrador: ${this.motivoCancelacion.trim()}`
    };

    this.reservaService.cancelarReservaComoAdmin(reservaDto).subscribe({
      next: (resp: any) => {
        // si el status es ok todo salio bien
        if (resp && resp.status === 'OK') {
          this.successMessage = '¡Reserva cancelada con éxito!';
          this.buscarReservas(); // ejecuta tu refresco original
        } else {
          // leemos desde resp.data porque ahi viaja el texto del error
          this.errorMessage = resp?.data || 'No se pudo cancelar la reserva.';
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
        this.motivoCancelacion = ''; // limpiamos el cuadro de texto
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