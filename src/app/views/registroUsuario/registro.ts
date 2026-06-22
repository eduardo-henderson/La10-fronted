import { Component, OnInit } from '@angular/core';
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
export class RegistroComponent implements OnInit {
  // mantengo el objeto con todos los campos correspondientes a tu entidad
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
    estadoUsuario: 'ACTIVO' 
  };

  // mantengo la bandera para gestionar el comportamiento de la pantalla
  esEdicion: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // invoco la lectura del almacenamiento local al inicializar
    this.comprobarModoVista();
  }

  comprobarModoVista(): void {
    // verifico si el perfil esta guardado en el almacenamiento local
    const usuarioLogueado = localStorage.getItem('usuario_actual');
    if (usuarioLogueado) {
      this.esEdicion = true;
      this.usuario = JSON.parse(usuarioLogueado);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  onRegister() {
    console.log('Datos del usuario a registrar:', this.usuario); 
    // asigne el tipo unknown a los parametros para eliminar el error de any implicito
    this.authService.registro(this.usuario).subscribe({
      next: (response: unknown) => {
        alert('¡Usuario registrado con éxito!');
        this.router.navigate(['/login']); 
      },
      error: (error: unknown) => {
        console.error(error);
        alert('Hubo un error en el registro');
      }
    });
  }

  onEditar(): void {
    console.log('enviando cambios de perfil unificados:', this.usuario);
    // asigne el tipo unknown a las respuestas para evitar restricciones estrictas
    this.authService.editarUsuario(this.usuario).subscribe({
      next: (response: unknown) => {
        alert('datos actualizados con exito');
        localStorage.setItem('usuario_actual', JSON.stringify(this.usuario));
      },
      error: (error: unknown) => {
        console.error(error);
        alert('error al intentar actualizar los datos');
      }
    });
  }
}
