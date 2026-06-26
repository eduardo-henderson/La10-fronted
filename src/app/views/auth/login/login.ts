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
      this.router.navigate(['/home']);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
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
          const token = res?.token || res?.jwt || res?.accessToken;

          if (token) {
            localStorage.setItem('auth_token', token);
            
            try {
              // 1. Decodificamos la parte central (Payload) del JWT
              const payloadBase64 = token.split('.')[1];
              // decodeURIComponent y escape previenen problemas si hay tildes o eñes en el nombre
              const payloadDecodificado = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));

              // 2. Guardamos el objeto serializado extrayendo los datos reales desde los claims del Token
              localStorage.setItem('usuario_actual', JSON.stringify({
                idUsuario: payloadDecodificado.idUsuario || null,
                nombre: payloadDecodificado.nombre || '',
                apellido: payloadDecodificado.apellido || '',
                email: payloadDecodificado.email || '', // Nota: si querés el email real, recordá agregarlo como .claim() en Java
                telefono: payloadDecodificado.telefono || '',
                fechaNacimiento: '',
                contrasenia: '',
                cedula: payloadDecodificado.sub || this.cedula, // En Jwts el subject (.setSubject) viaja en la propiedad 'sub'
                tipousuario: res?.tipoUsuario || 'CLIENTE',
                estadoUsuario: 'ACTIVO'
              }));

            } catch (error) {
              console.error('Error decodificando el token JWT:', error);
            }
          }
          
          if (res?.tipoUsuario) {
            localStorage.setItem('user_role', res.tipoUsuario);
          }

          this.successMessage = 'Login exitoso. Redirigiendo...';

          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 500);
        },

        error: (err) => {
          console.log('ERROR LLEGÓ AL COMPONENTE', err);
          let mensaje = 'Error al iniciar sesión';

          if (err.error?.message) {
            mensaje = err.error.message;
          }

          if (err.status === 401) {
            mensaje = err.error?.message || 'Usuario o contraseña incorrectos';
          } else if (err.status === 403) {
            mensaje = err.error?.message || 'Su cuenta no tiene permisos para acceder. Comuníquese con el administrador.';
          } else if (err.status === 0) {
            mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          }

          this.errorMessage = mensaje;
        },
      });

  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
