import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  UsuarioAdminService,
  UsuarioAdmin,
  NuevoUsuarioPayload,
  EditarUsuarioPayload,
} from '../../service/usuario-admin.service';
import { AuthService } from '../../service/auth.service';

interface FormUsuario {
  idUsuario: number | null;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  cedula: string;
  contrasenia: string;
  tipousuario: string;
  estadoUsuario: string;
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.html',
  styleUrls: ['./usuarios-admin.css'],
})
export class UsuariosAdminComponent implements OnInit {
  private servicio = inject(UsuarioAdminService);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(AuthService);
  private filtroTimeout: any;

  usuarios: UsuarioAdmin[] = [];
  cargando = false;
  mensajeError = '';
  filtro = '';

  pagina = 0;
  tamanio = 10;
  totalPaginas = 0;
  totalUsuarios = 0;
  esUltima = false;
  esPrimera = true;

  modalAbierto = false;
  modoEdicion = false;
  guardando = false;
  errorModal = '';
  form: FormUsuario = this.formVacio();

  modalBorrarAbierto = false;
  borrando = false;
  usuarioABorrar: UsuarioAdmin | null = null;

  aviso = '';

  ngOnInit(): void {
    this.cargar();
  }

  // Cargar

  cargar(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.servicio.listarPaginado(this.pagina, this.tamanio, this.filtro).subscribe({
      next: (pagina) => {
        this.usuarios = pagina.content ?? [];
        this.totalPaginas = pagina.totalPages ?? 0;
        this.totalUsuarios = pagina.totalElements ?? 0;
        this.esUltima = pagina.last ?? true;
        this.esPrimera = pagina.first ?? true;
        this.pagina = pagina.number ?? 0;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError =
          err?.status === 401 || err?.status === 403
            ? 'Tu sesion expiro o no tenes permisos para ver los usuarios.'
            : 'No se pudieron cargar los usuarios. Verifica que el backend este corriendo.';
        this.cdr.detectChanges();
      },
    });
  }

  get usuariosFiltrados(): UsuarioAdmin[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.usuarios;
    return this.usuarios.filter((u) =>
      [u.nombre, u.apellido, u.email, u.cedula, u.telefono]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q)),
    );
  }

  get numerosPagina(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i);
  }

  // Modal crear/editar

  abrirCrear(): void {
    this.modoEdicion = false;
    this.form = this.formVacio();
    this.errorModal = '';
    this.modalAbierto = true;
  }

  abrirEditar(u: UsuarioAdmin): void {
    this.modoEdicion = true;
    this.errorModal = '';
    this.form = {
      idUsuario: u.idUsuario,
      nombre: u.nombre ?? '',
      apellido: u.apellido ?? '',
      email: u.email ?? '',
      telefono: u.telefono ?? '',
      fechaNacimiento: u.fechaNacimiento ?? '',
      cedula: u.cedula ?? '',
      contrasenia: '',
      tipousuario: u.tipousuario ?? 'CLIENTE',
      estadoUsuario: u.estadoUsuario ?? 'ACTIVO',
    };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalAbierto = false;
    this.errorModal = '';
  }

  guardar(formRef: NgForm): void {
    if (formRef.invalid || this.guardando) {
      formRef.form.markAllAsTouched();
      this.errorModal = 'Completa todos los campos obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorModal = '';

    if (this.modoEdicion) {
      this.enviarEdicion();
    } else {
      this.enviarCreacion();
    }
  }

  soyYo(u: UsuarioAdmin): boolean {
    return u.idUsuario === this.miId;
  }

  puedeEliminar(u: UsuarioAdmin): boolean {
    const esAdmin = (u.tipousuario || '').toUpperCase() === 'ADMINISTRADOR';
    return !esAdmin;
  }

  puedeEditar(u: UsuarioAdmin): boolean {
    const esAdmin = (u.tipousuario || '').toUpperCase() === 'ADMINISTRADOR';
    if (esAdmin && !this.soyYo(u)) return false;
    return true;
  }

  paginaSiguiente(): void {
    if (this.esUltima) return;
    this.pagina++;
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.esPrimera) return;
    this.pagina--;
    this.cargar();
  }

  irAPagina(n: number): void {
    if (n < 0 || n >= this.totalPaginas || n === this.pagina) return;
    this.pagina = n;
    this.cargar();
  }

  private enviarCreacion(): void {
    const payload: NuevoUsuarioPayload = {
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      email: this.form.email,
      telefono: this.form.telefono,
      fechaNacimiento: this.form.fechaNacimiento,
      cedula: this.form.cedula,
      contrasenia: this.form.contrasenia,
      tipousuario: this.form.tipousuario,
      estadoUsuario: this.form.estadoUsuario,
    };

    this.servicio.crear(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mostrarAviso('Usuario creado correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorModal = this.textoError(err, 'No se pudo crear el usuario.');
        this.cdr.detectChanges();
      },
    });
  }

  private get miId(): number {
    return this.auth.getUsuarioId();
  }

  private enviarEdicion(): void {
    const payload: EditarUsuarioPayload = {
      idUsuario: this.form.idUsuario as number,
      nombre: this.form.nombre,
      apellido: this.form.apellido,
      email: this.form.email,
      telefono: this.form.telefono,
      fechaNacimiento: this.form.fechaNacimiento,
      tipousuario: this.form.tipousuario,
      estadoUsuario: this.form.estadoUsuario,
    };
    if (this.form.contrasenia.trim()) {
      payload.nuevaClave = this.form.contrasenia.trim();
    }

    this.servicio.editar(payload).subscribe({
      next: (resp) => {
        this.guardando = false;
        if (resp?.status === 'ERROR') {
          this.errorModal = resp?.data || 'No se pudo editar el usuario.';
          this.cdr.detectChanges();
          return;
        }
        this.modalAbierto = false;
        this.mostrarAviso('Cambios guardados correctamente.');
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorModal = this.textoError(err, 'No se pudo editar el usuario.');
        this.cdr.detectChanges();
      },
    });
  }

  // Modal eliminar

  abrirBorrar(u: UsuarioAdmin): void {
    this.usuarioABorrar = u;
    this.modalBorrarAbierto = true;
  }

  cerrarBorrar(): void {
    if (this.borrando) return;
    this.modalBorrarAbierto = false;
    this.usuarioABorrar = null;
  }

  confirmarBorrar(): void {
    if (!this.usuarioABorrar || this.borrando) return;

    this.borrando = true;
    this.servicio.eliminar(this.usuarioABorrar.idUsuario).subscribe({
      next: (resp) => {
        this.borrando = false;
        this.modalBorrarAbierto = false;
        this.usuarioABorrar = null;
        const msg = resp?.data || 'Usuario eliminado.';
        this.mostrarAviso(msg);
        this.cargar();
      },
      error: (err) => {
        this.borrando = false;
        this.modalBorrarAbierto = false;
        this.usuarioABorrar = null;
        this.mensajeError = this.textoError(err, 'No se pudo eliminar el usuario.');
        this.cdr.detectChanges();
      },
    });
  }

  onBuscar(): void {
    clearTimeout(this.filtroTimeout);
    this.filtroTimeout = setTimeout(() => {
      this.pagina = 0;
      this.cargar();
    }, 350);
  }

  private formVacio(): FormUsuario {
    return {
      idUsuario: null,
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fechaNacimiento: '',
      cedula: '',
      contrasenia: '',
      tipousuario: 'CLIENTE',
      estadoUsuario: 'ACTIVO',
    };
  }

  private textoError(err: any, fallback: string): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'No tenes permisos para esta accion o tu sesion expiro.';
    }
    return err?.error?.message || err?.message || fallback;
  }

  private mostrarAviso(texto: string): void {
    this.aviso = texto;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.aviso = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  claseBadge(valor: string): string {
    const v = (valor || '').toUpperCase();
    if (v === 'ADMINISTRADOR') return 'badge-admin';
    if (v === 'ACTIVO') return 'badge-active';
    if (v === 'SUSPENDIDO') return 'badge-warn';
    if (v === 'BLOQUEADO') return 'badge-danger';
    if (v === 'CLIENTE') return 'badge-neutral';
    return 'badge-neutral';
  }

  trackById(_i: number, u: UsuarioAdmin): number {
    return u.idUsuario;
  }
}
