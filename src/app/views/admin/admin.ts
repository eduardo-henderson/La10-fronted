import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';

interface Recurso {
  clave: string;
  etiqueta: string;
  icono: string; // clase de bootstrap-icons
  activo: boolean;
}

interface FilaUsuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedula: string;
  tipousuario: string;
  estadoUsuario: string;
}

interface FilaEspacio {
  idEspacio: number;
  nombre: string;
  capacidad: number;
  habilitado: boolean;
  precioBase: number;
  permiteMediaReserva: boolean;
  tipo: string;
  idCanchaAsociada: number | null;
}

interface FilaReserva {
  idReserva: number;
  horaInicio: string;
  horaFin: string;
  tipoDeReserva: string;
  estadoDeReserva: string;
  precioTotal: number;
  necesitaRival: boolean;
  idUsuario: number | null;
  idEspacio: number | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  private servicioAuth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Navegación lateral. Las tres secciones están activas.
  recursos: Recurso[] = [
    { clave: 'usuarios', etiqueta: 'Usuarios', icono: 'bi bi-people', activo: true },
    { clave: 'espacios', etiqueta: 'Espacios', icono: 'bi bi-building', activo: true },
    { clave: 'reservas', etiqueta: 'Reservas', icono: 'bi bi-calendar-event', activo: true },
    // { clave: 'pagos', etiqueta: 'Pagos', icono: 'bi bi-cash-coin', activo: true },
  ];

  seleccionado: string = 'usuarios';

  usuarios: FilaUsuario[] = [];
  espacios: FilaEspacio[] = [];
  reservas: FilaReserva[] = [];

  cargando = false;
  mensajeError = '';

  ngOnInit(): void {
    // Guardia: debe estar logueado Y ser administrador.
    if (!this.servicioAuth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.servicioAuth.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }
    this.cargarUsuarios();
  }

  seleccionarRecurso(recurso: Recurso): void {
    if (!recurso.activo) {
      return;
    }
    this.seleccionado = recurso.clave;
    this.mensajeError = '';

    if (recurso.clave === 'usuarios' && this.usuarios.length === 0) {
      this.cargarUsuarios();
    } else if (recurso.clave === 'espacios' && this.espacios.length === 0) {
      this.cargarEspacios();
    } else if (recurso.clave === 'reservas' && this.reservas.length === 0) {
      this.cargarReservas();
    }
  }

  get recursoActivo(): Recurso | undefined {
    return this.recursos.find((r) => r.clave === this.seleccionado);
  }

  // ---------- Cargas desde el backend (vía proxy.conf.json) ----------

  cargarUsuarios(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.http.get<FilaUsuario[]>('/api/version1/usuarios/listarTodos').subscribe({
      next: (datos) => {
        this.usuarios = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => this.manejarError(err, 'los usuarios'),
    });
  }

  cargarEspacios(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.http.get<FilaEspacio[]>('/api/version1/espacios/listarTodos').subscribe({
      next: (datos) => {
        this.espacios = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => this.manejarError(err, 'los espacios'),
    });
  }

  cargarReservas(): void {
    this.cargando = true;
    this.mensajeError = '';

    // Si los espacios aún no se cargaron, los traemos en silencio
    // para poder mostrar el nombre del espacio en cada reserva.
    if (this.espacios.length === 0) {
      this.http.get<FilaEspacio[]>('/api/version1/espacios/listarTodos').subscribe({
        next: (datos) => {
          this.espacios = Array.isArray(datos) ? datos : [];
        },
        error: () => {
          /* ignoramos: caeremos al ID como respaldo */
        },
      });
    }

    this.http.get<FilaReserva[]>('/api/version1/reservas/listarTodos').subscribe({
      next: (datos) => {
        this.reservas = Array.isArray(datos) ? datos : [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => this.manejarError(err, 'las reservas'),
    });
  }

  private manejarError(err: any, queFallo: string): void {
    this.cargando = false;
    if (err.status === 401 || err.status === 403) {
      this.mensajeError = 'No tienes permisos para ver esta sección o tu sesión expiró.';
    } else {
      this.mensajeError =
        'No se pudieron cargar ' + queFallo + '. Verifica que el backend esté corriendo.';
    }
    this.cdr.detectChanges();
    console.error('Error al cargar ' + queFallo + ':', err);
  }

  // ---------- Ayudantes de presentación ----------

  // Resuelve el nombre del espacio a partir de su ID; si no está, muestra el ID.
  nombreEspacio(idEspacio: number | null): string {
    if (idEspacio == null) {
      return '—';
    }
    const espacio = this.espacios.find((e) => e.idEspacio === idEspacio);
    return espacio ? espacio.nombre : 'Espacio #' + idEspacio;
  }

  // Mapea un rol/estado a una clase CSS de badge.
  claseBadge(valor: string): string {
    const v = (valor || '').toUpperCase();
    if (v === 'ADMINISTRADOR') return 'badge-admin';
    if (v === 'ACTIVO' || v === 'CONFIRMADO') return 'badge-active';
    if (v === 'PENDIENTE') return 'badge-warn';
    if (v === 'SUSPENDIDO' || v === 'BLOQUEADO' || v === 'CANCELADO') return 'badge-danger';
    return 'badge-neutral';
  }

  volver(): void {
    this.router.navigate(['/home']);
  }
}
