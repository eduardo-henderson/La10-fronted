import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
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
  encapsulation: ViewEncapsulation.None
})
export class EditarUsuarioComponent implements OnInit {
  private router = inject(Router);
  protected authService = inject(AuthService);

  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isSaving = false;

  usuario = {
    idUsuario: null as any,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    contrasenia: '',
    cedula: '',
    tipousuario: '',
    estadoUsuario: '',
    claveActual: '',
    nuevaClave: ''
  };

  ngOnInit(): void {
    const usuarioLogueado = localStorage.getItem('usuario_actual');
    if (usuarioLogueado) {
      const datosRaw = JSON.parse(usuarioLogueado);

      this.usuario = {
        ...datosRaw,
        idUsuario: datosRaw.idusuario || datosRaw.idUsuario || null,
        claveActual: '',
        nuevaClave: ''
      };
    }
    this.isLoading = false;
  }

  goHome(): void {
    this.router.navigate(['/espacios']);
  }

  guardarCambios(form: any): void {
    if (form.invalid || this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    // Estructura completa mapeada para interceptores de persistencia en Java
    const usuarioEnvio = {
      idusuario: this.usuario.idUsuario,
      idUsuario: this.usuario.idUsuario,
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      email: this.usuario.email,
      telefono: this.usuario.telefono,
      fechaNacimiento: this.usuario.fechaNacimiento,
      cedula: this.usuario.cedula,
      tipousuario: this.usuario.tipousuario,
      estadoUsuario: this.usuario.estadoUsuario,

      // Enviamos las contraseñas duplicadas con los nombres mas comunes en controladores de Spring
      contrasenia: this.usuario.nuevaClave ? this.usuario.nuevaClave : this.usuario.contrasenia,
      password: this.usuario.nuevaClave ? this.usuario.nuevaClave : this.usuario.contrasenia,

      // Mapeo estricto para el cambio de credenciales
      claveActual: this.usuario.claveActual || null,
      contraseniaActual: this.usuario.claveActual || null,
      currentPassword: this.usuario.claveActual || null,

      nuevaClave: this.usuario.nuevaClave || null,
      nuevaContrasenia: this.usuario.nuevaClave || null,
      newPassword: this.usuario.nuevaClave || null
    };

    this.authService.editarUsuario(usuarioEnvio).subscribe({
      next: (response: any) => {
        this.successMessage = '¡Los cambios se guardaron con éxito!';

        if (response?.token || response?.jwt) {
          localStorage.setItem('auth_token', response.token || response.jwt);
        }

        localStorage.setItem('usuario_actual', JSON.stringify({
          ...this.usuario,
          idusuario: this.usuario.idUsuario,
          contrasenia: this.usuario.nuevaClave ? this.usuario.nuevaClave : this.usuario.contrasenia,
          claveActual: '',
          nuevaClave: ''
        }));

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error: unknown) => {
        console.error(error);
        this.errorMessage = 'Hubo un error al intentar actualizar los datos en el servidor';
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }
}
