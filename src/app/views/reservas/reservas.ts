import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; //importamos ChangeDetectorRef para detect cambios
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Espacio } from '../../models/espacio.model';
import { EspacioService } from '../../service/espacio';
import { ReservaService } from '../../service/reserva';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

    //EXTRAEMOS EL ID DESDE LOGICA DE TOKEN
    const idUsuario = this.authService.getUsuarioId(); 

    //validar de seguridad por si no hay sesin o da 0
    if (idUsuario === 0) {
      this.errorMessage = 'No se pudo identificar tu ID de usuario desde la sesión.';
      this.isLoadingReservas = false;
      this.cdr.detectChanges();
      return;
    }

// listar reservas LE PASAMOS EL ID REAL DEL USUARIO LOGUEADO AL SERVICIO
    this.reservaService.listarReservas(idUsuario).subscribe({
      next: (resp: any) => {
        this.reservas = resp && Array.isArray(resp.data) ? resp.data : [];
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
//cancelar reserva
  cancelarReserva(item: any): void {
    const motivo = window.prompt(
      '¿Estás seguro de que deseas cancelar esta reserva?\nIngresa el motivo (opcional):'
    );

    if (motivo === null) return; 

    this.isLoadingReservas= true;
    this.errorMessage = '';   // limpiamos mensajes anteriores
    this.successMessage = '';  //limpiamos mensajes anteriores
    this.cdr.detectChanges();

    const reservaDto = {
      ...item,
      motivoCanc: motivo.trim() === '' ? 'Cancelado por el Administrador' : motivo
    };

    this.reservaService.cancelarReserva(reservaDto).subscribe({
      next: (resp: any) => {
        if (resp && (resp.status === 'OK' || resp.type === 'OK')) {
          //en vez de alert(), guardamos el mensaje en la variable
          this.successMessage = '¡Reserva cancelada con éxito!';
          this.cargarReservas();
        } else {
          this.errorMessage = resp?.message || 'No se pudo cancelar la reserva.';
          this.isLoadingReservas= false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoadingReservas= false;
        this.errorMessage = err.message || 'Error de red al intentar cancelar.';
        this.cdr.detectChanges();
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