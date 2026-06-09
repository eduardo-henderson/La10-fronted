import { Component, ChangeDetectorRef, OnInit } from '@angular/core'; // 🔥 Agrega OnInit
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
  styleUrls: ['./login.css']
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
    private cdr: ChangeDetectorRef // 🔥 Inyectado aquí
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

    this.authService.login(this.cedula, this.contrasenia)
    .pipe(
      finalize(() => {
        // 🔥 SIEMPRE se ejecuta (éxito o error)
        this.isLoading = false;
        this.cdr.detectChanges(); // 🔥 Obligamos al HTML a actualizar sus variables en pantalla
      })
    )
    .subscribe({
        next: (res) => {
          const token = res?.token || res?.jwt || res?.accessToken;

          if (token) {
            localStorage.setItem('auth_token', token);
          }

          this.successMessage = 'Login exitoso. Redirigiendo...';

          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 500);
        },

        error: (err) => {
          console.log('🔥 ERROR LLEGÓ AL COMPONENTE', err);

          let mensaje = 'Error al iniciar sesión';

          if (err.error?.message) {
            mensaje = err.error.message;
          }

          if (err.status === 401) {
            mensaje = mensaje || 'Usuario o contraseña incorrectos';
          } else if (err.status === 403) {
            mensaje = 'Acceso denegado';
          }

          this.errorMessage = mensaje; // Al asignarlo aquí, finalize detectará el cambio y repintará el html
        }
      });
  }

  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}