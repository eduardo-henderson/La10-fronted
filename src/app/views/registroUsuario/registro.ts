import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent {
  usuario = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    cedula: '',
    tipousuario: 'CLIENTE', 
    estadoUsuario: 'ACTIVO',
    contrasenia: '' 
  };

  constructor(private authService: AuthService, private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }

  onRegister() {
    console.log('Datos del usuario a registrar:', this.usuario); // 🔥 DEBUG
    // Aquí disparamos la petición al backend al presionar el botón
    this.authService.registro(this.usuario).subscribe({
      next: (response) => {
        alert('¡Usuario registrado con éxito!');
        this.router.navigate(['/login']); 
      },
      error: (error) => {
        console.error(error);
        alert('Hubo un error en el registro');
      }
    });
  }
}
