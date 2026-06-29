import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editarusuario.html',
  styleUrls: ['./editarusuario.css'],
  encapsulation: ViewEncapsulation.None,
})
export class EditarUsuarioComponent implements OnInit {
  private router = inject(Router);
  protected authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;

  datosError = '';
  datosSuccess = '';
  claveError = '';
  claveSuccess = '';
  isSavingDatos = false;
  isSavingClave = false;

  verClaves = false;

  usuario = {
    idUsuario: null as any,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    cedula: '',
    tipousuario: '',
    estadoUsuario: '',
  };

  claveActual = '';
  nuevaClave = '';
  confirmarClave = '';

  private cargarDesdeLocalStorage(): void {
    const raw = localStorage.getItem('usuario_actual');
    if (raw) {
      const d = JSON.parse(raw);
      this.usuario = {
        ...this.usuario,
        ...d,
        idUsuario: d.idusuario || d.idUsuario || null,
      };
    }
  }

  ngOnInit(): void {
    const id = this.authService.getUsuarioId();

    if (!id) {
      this.cargarDesdeLocalStorage();
      this.isLoading = false;
      return;
    }

    this.authService.obtenerUsuario(id).subscribe({
      next: (resp: any) => {
        if (resp?.status === 'ERROR' || !resp?.data) {
          this.cargarDesdeLocalStorage();
        } else {
          const u = resp.data;
          this.usuario = {
            idUsuario: u.idUsuario ?? id,
            nombre: u.nombre ?? '',
            apellido: u.apellido ?? '',
            email: u.email ?? '',
            telefono: u.telefono ?? '',
            fechaNacimiento: u.fechaNacimiento ?? '',
            cedula: u.cedula ?? '',
            tipousuario: u.tipousuario ?? '',
            estadoUsuario: u.estadoUsuario ?? '',
          };
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargarDesdeLocalStorage();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private persistirUsuarioLocal(): void {
    localStorage.setItem(
      'usuario_actual',
      JSON.stringify({ ...this.usuario, idusuario: this.usuario.idUsuario }),
    );
  }

  goHome(): void {
    this.router.navigate(['/espacios']);
  }

  get clavesCoinciden(): boolean {
    return this.nuevaClave === this.confirmarClave;
  }

  guardarDatos(form: any): void {
    this.datosError = '';
    this.datosSuccess = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.datosError = 'Completá los campos obligatorios.';
      return;
    }
    if (this.isSavingDatos) return;
    this.isSavingDatos = true;

    const payload = {
      idUsuario: this.usuario.idUsuario,
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      email: this.usuario.email,
      telefono: this.usuario.telefono,
    };

    this.authService.editarUsuario(payload).subscribe({
      next: (resp: any) => {
        this.isSavingDatos = false;
        if (resp?.status === 'ERROR') {
          this.datosError = resp?.data || 'No se pudieron guardar los cambios.';
        } else {
          this.datosSuccess = 'Datos actualizados correctamente.';
          this.persistirUsuarioLocal();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingDatos = false;
        this.datosError = 'Hubo un error al actualizar los datos en el servidor.';
        this.cdr.detectChanges();
      },
    });
  }

  cambiarClave(form: any): void {
    this.claveError = '';
    this.claveSuccess = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.claveError = 'Completá los campos de contraseña.';
      return;
    }
    if (this.nuevaClave.length < 6) {
      this.claveError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.clavesCoinciden) {
      this.claveError = 'Las contraseñas no coinciden.';
      return;
    }
    if (this.isSavingClave) return;
    this.isSavingClave = true;

    const payload = {
      idUsuario: this.usuario.idUsuario,
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      email: this.usuario.email,
      telefono: this.usuario.telefono || null,
      claveActual: this.claveActual,
      nuevaClave: this.nuevaClave,
    };

    this.authService.editarUsuario(payload).subscribe({
      next: (resp: any) => {
        this.isSavingClave = false;
        if (resp?.status === 'ERROR') {
          this.claveError = resp?.data || 'No se pudo cambiar la contraseña.';
        } else {
          this.claveSuccess = 'Contraseña actualizada correctamente.';
          this.claveActual = '';
          this.nuevaClave = '';
          this.confirmarClave = '';
          form.resetForm();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingClave = false;
        this.claveError = 'Hubo un error al cambiar la contraseña.';
        this.cdr.detectChanges();
      },
    });
  }
}
