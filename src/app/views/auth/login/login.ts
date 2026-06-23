import { Component, ChangeDetectorRef, OnInit } from '@angular/core'; // 🔥 agrega oninit
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
    private cdr: ChangeDetectorRef, // 🔥 inyectado aqui
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
          // siempre se ejecuta (exito o error)
          this.isLoading = false;
          this.cdr.detectChanges(); // obligamos al html a actualizar sus variables en pantalla
        }),
      )
      .subscribe({
        next: (res) => {
          const token = res?.token || res?.jwt || res?.accessToken;

          if (token) {
            localStorage.setItem('auth_token', token);
          }
          if (res?.tipoUsuario) {
            localStorage.setItem('user_role', res.tipoUsuario); // almacena el rol del usuario para admin panel o funcionalidades especificas a un rol
          }

          // extraigo el objeto de datos del usuario que responde tu backend al autenticarse
          // si tu backend envia los datos planos en la raiz o en otra propiedad, adaptala aqui
          const datosUsuario = res?.usuario || res;

          if (datosUsuario) {
            // guardo el objeto serializado en el localstorage con la clave que configuramos en el perfil
            localStorage.setItem(
              'usuario_actual',
              JSON.stringify({
                idUsuario: datosUsuario.idUsuario || null,
                nombre: datosUsuario.nombre || '',
                apellido: datosUsuario.apellido || '',
                email: datosUsuario.email || '',
                telefono: datosUsuario.telefono || '',
                fechaNacimiento: datosUsuario.fechaNacimiento || '',
                contrasenia: datosUsuario.contrasenia || '',
                cedula: datosUsuario.cedula || this.cedula, // uso la cedula ingresada como respaldo
                tipousuario: datosUsuario.tipousuario || res?.tipoUsuario || 'CLIENTE',
                estadoUsuario: datosUsuario.estadoUsuario || 'ACTIVO',
              }),
            );
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

          this.errorMessage = mensaje; // al asignarlo aqui, finalize detectara el cambio y repintara el html
        },
      });
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
