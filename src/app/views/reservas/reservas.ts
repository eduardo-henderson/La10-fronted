import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; //importamos ChangeDetectorRef para detect cambios
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Espacio } from '../../models/espacio.model';
import { EspacioService } from '../../service/espacio';
import { ReservaService } from '../../service/reserva';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css']
})
export class ReservasComponent implements OnInit {
  reservas: any[] = [];
  listaEspacios: Espacio[] = [];
  
  isLoadingReservas: boolean = false;
  isLoadingEspacios: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  //paginacion para Mis Reservas
  paginaActual: number = 0;
  tamanioPagina: number = 5;
  totalPaginas: number = 0;
  esPrimeraPagina: boolean = true;
  esUltimaPagina: boolean = true;

  totalElementos: number = 0;
  elementosPagina: number = 0;

  constructor(
    private espacioService: EspacioService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef //unyectamos el detector de cambios
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarEspacios();
    this.cargarReservas();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  cargarEspacios(): void {
    this.isLoadingEspacios = true;
    this.espacioService.getEspacios().subscribe({
      next: (data: any) => {
        const rawList: any[] = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : [];

        this.listaEspacios = rawList.map((item: any) => ({
          ...item,
          idEspacio: item.idEspacio ?? item.id ?? 0,
          nombre: item.nombre ?? `Espacio #${item.idEspacio ?? item.id}`,
        }));
        this.isLoadingEspacios = false;
        this.cdr.detectChanges(); //refrescar 
      },
      error: (err) => {
        this.isLoadingEspacios = false;
        console.error('Error al cargar nombres de espacios:', err);
      }
    });
  }

  cargarReservas(): void {
    this.isLoadingReservas = true;
    this.errorMessage = '';

    //extraemos el ID desde la logica de token
    const idUsuario = this.authService.getUsuarioId(); 

    //validacion de seguridad por si no hay sesion o da 0
    if (idUsuario === 0) {
      this.errorMessage = 'No se pudo identificar tu ID de usuario desde la sesión.';
      this.isLoadingReservas = false;
      this.cdr.detectChanges();
      return;
    }

    //listar reservas pasando el ID real, pagina y tamaño
    this.reservaService.listarReservas(idUsuario, this.paginaActual, this.tamanioPagina).subscribe({
      next: (resp: any) => {
        //extraemos la lista desde resp.data.content siguiendo la forma de Spring Data Page
        if (resp && resp.data && Array.isArray(resp.data.content)) {
          this.reservas = resp.data.content;
          
          // Mapeamos los indicadores de paginación del back
          this.totalPaginas = resp.data.totalPages ?? 1;
          this.esPrimeraPagina = resp.data.first ?? true;
          this.esUltimaPagina = resp.data.last ?? true;

          // NUEVO: Guardamos los contadores exactos del servidor
          this.totalElementos = resp.data.totalElements ?? 0;
          this.elementosPagina = resp.data.numberOfElements ?? 0;
        } else {
          this.reservas = [];
          this.totalPaginas = 0;
          this.totalElementos = 0;
          this.elementosPagina = 0;
          this.esPrimeraPagina = true;
          this.esUltimaPagina = true;
        }
        this.isLoadingReservas = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isLoadingReservas = false;
        this.errorMessage = err.message || 'No se pudieron cargar tus reservas.';
        this.cdr.detectChanges(); 
      }
    });
  }

  //navegacion de paginas
  paginaAnterior(): void {
    if (!this.esPrimeraPagina) {
      this.paginaActual--;
      this.cargarReservas();
    }
  }

  paginaSiguiente(): void {
    if (!this.esUltimaPagina) {
      this.paginaActual++;
      this.cargarReservas();
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
//cancelar reserva
isModalOpen = false;
motivoCancelacion = '';
itemACancelar: any = null;

abrirModalCancelacion(item: any): void {
  this.itemACancelar = item;
  this.motivoCancelacion = ''; 
  this.isModalOpen = true;
}

cancelarReserva(): void {
  console.log('¡El botón funciona! Iniciando cancelación para:', this.itemACancelar);
  if (!this.itemACancelar) return;

  this.isModalOpen = false; 
  this.cdr.detectChanges(); //forzamos el cierre visual del modal de inmediato

  this.isLoadingReservas = true;
  this.errorMessage = '';   
  this.successMessage = '';  
  this.cdr.detectChanges();

  const reservaDto = {
    ...this.itemACancelar,
    motivoCanc: this.motivoCancelacion.trim() === '' ? 'Cancelado por el Administrador' : this.motivoCancelacion
  };

  this.reservaService.cancelarReserva(reservaDto).subscribe({
    next: (resp: any) => {
      // sSi el status es OK todo salio bien
      if (resp && resp.status === 'OK') {
        this.successMessage = '¡Reserva cancelada con éxito!';
        this.cargarReservas(); //recargamos el listado para ver los cambios
      } else {
        //Leemos desde 'resp.data' donde viaja en string de error
        this.errorMessage = resp?.data || 'No se pudo cancelar la reserva.';
        this.isLoadingReservas = false;
        this.cdr.detectChanges();
      }
    },
    error: (err) => {
      this.isLoadingReservas = false;
      this.errorMessage = err.message || 'Error de red al intentar cancelar.';
      this.cdr.detectChanges();
    },
    complete: () => {
      this.itemACancelar = null;
      this.motivoCancelacion = ''; //limpiamos el cuadro de texto
    }
  });
}

  getEspacioNombre(idEspacio: number): string {
    const espacio = this.listaEspacios.find(item => item.idEspacio === idEspacio);
    return espacio ? espacio.nombre : `Espacio #${idEspacio}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}