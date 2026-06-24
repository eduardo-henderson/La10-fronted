import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  cedula: string = '';
  contrasenia: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  mostrarPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  login(): void {
    if (!this.cedula || !this.contrasenia) {
      this.errorMessage = 'Por favor completa cédula y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService
      .login(this.cedula, this.contrasenia)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          console.log('Respuesta del Backend al iniciar sesión:', res);

          const token = res?.token || res?.jwt || res?.accessToken;

          if (token) {
            // 1. Guardamos el token primero en el disco
            localStorage.setItem('auth_token', token);
          }

          const rol = res?.tipoUsuario || res?.usuario?.tipousuario || res?.tipousuario;
          if (rol) {
            localStorage.setItem('user_role', rol);
          }

          // 2. SOLUCIÓN MAESTRA: Extraemos el ID real decodificando el token JWT recién guardado
          const idRealDesdeToken = this.authService.getUsuarioId();
          console.log('ID extraído exitosamente del JWT:', idRealDesdeToken);

          const datosUsuario = res?.usuario || res;

          if (datosUsuario) {
            localStorage.setItem('usuario_actual', JSON.stringify({
              idUsuario: idRealDesdeToken || null, // Usamos el ID del token
              idusuario: idRealDesdeToken || null, // Duplicamos por consistencia de base de datos
              nombre: datosUsuario.nombre || '',
              apellido: datosUsuario.apellido || '',
              email: datosUsuario.email || '',
              telefono: datosUsuario.telefono || '',
              fechaNacimiento: datosUsuario.fechaNacimiento || '',
              contrasenia: datosUsuario.contrasenia || this.contrasenia,
              cedula: datosUsuario.cedula || this.cedula,
              tipousuario: rol || 'CLIENTE',
              estadoUsuario: datosUsuario.estadoUsuario || 'ACTIVO'
            }));
          }

          this.successMessage = 'Login exitoso. Redirigiendo...';

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        },

        error: (err) => {
          console.log('ERROR LLEGÓ AL COMPONENTE', err);
          let mensaje = 'Error al iniciar sesión';
          if (err.error?.message) {
            mensaje = err.error.message;
          }
          if (err.status === 401) {
            mensaje = mensaje || 'Usuario o contraseña incorrectos';
          } else if (err.status === 403) {
            mensaje = 'Acceso denegado';
          }
          this.errorMessage = mensaje;
        },
      });
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
