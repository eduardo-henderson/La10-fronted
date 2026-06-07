import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  cedula: string = '';
  contrasenia: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Para mostrar/ocultar contraseña
  mostrarPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Realiza el login con las credenciales proporcionadas
   * Backend requiere: Cédula + Contraseña
   */
  login(): void {
  if (!this.cedula || !this.contrasenia) {
    this.errorMessage = 'Por favor completa cédula y contraseña';
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  this.authService.login(this.cedula, this.contrasenia).subscribe({
      next: (res) => {
        console.log('🔐 Login response:', res);

        //GUARDAR TOKEN 
        const token = res?.token || res?.jwt || res?.accessToken;

        if (token) {
          localStorage.setItem('auth_token', token);
          console.log('Token guardado correctamente');
        } else {
          console.log('❌ No vino token en la respuesta');
        }

        this.successMessage = 'Login exitoso. Redirigiendo...';
        this.isLoading = false;

        // navegar DESPUES de guardar token
        setTimeout(() => {
          this.router.navigate(['/espacios']);
        }, 500);
      },
      error: (err) => {
        this.isLoading = false;

        const status = err?.status;
        const serverMsg = err?.error
          ? (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))
          : null;

        if (status === 403) {
          this.errorMessage = 'Acceso denegado (403). Token inválido o credenciales incorrectas.';
        } else {
          this.errorMessage = serverMsg || err.message || 'Error al iniciar sesión.';
        }

        console.error('Error de login:', err);
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  /**
   * Maneja presionar Enter en los inputs
   */
  onKeyPress(event: any): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}

