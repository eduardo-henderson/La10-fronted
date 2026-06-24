import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
})

export class RegistroComponent implements OnInit {
  private router = inject(Router);
  protected authService = inject(AuthService);

  // El objeto del usuario arranca siempre limpio para un registro nuevo
  usuario = {
    idUsuario: null,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    contrasenia: '',
    cedula: '',
    tipousuario: 'CLIENTE',
    estadoUsuario: 'ACTIVO',
  };

    constructor() {}

  ngOnInit(): void {
    // Queda vacío de forma limpia para el registro nuevo
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  onRegister() {
    console.log('Datos del usuario a registrar:', this.usuario);
    this.authService.registro(this.usuario).subscribe({
      next: (response: unknown) => {
        alert('¡Usuario registrado con éxito!');
        this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        console.error(error);
        alert('Hubo un error en el registro');
      },
    });
  }
}

