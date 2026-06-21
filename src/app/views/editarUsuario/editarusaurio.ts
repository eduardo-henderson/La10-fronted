import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../service/editarusuario';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editarusuario.html',
  styleUrls: ['./editarusuario.css']
})
export class EditarUsuarioComponent implements OnInit {
  // Objeto para el formulario (Datos editables y visuales)
  usuario: any = {
    idUsuario: 1, // Cambiar dinámicamente si es necesario
    nombre: '',
    apellido: '',
    email: '',
    cedula: '', // Solo lectura
    telefono: '',
    fechaNacimiento: '',
    claveActual: '', // Requeridos por el DTO del backend
    nuevaClave: ''
  };

  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.usuarioService.getUsuario(this.usuario.idUsuario).subscribe({
      next: (resp: any) => {
        if (resp.status === 'OK' && resp.data) {
          // llenamos el objeto local con la respuesta de la API
          this.usuario.nombre = resp.data.nombre;
          this.usuario.apellido = resp.data.apellido;
          this.usuario.email = resp.data.email;
          this.usuario.cedula = resp.data.cedula;
          this.usuario.telefono = resp.data.telefono;
          this.usuario.fechaNacimiento = resp.data.fechaNacimiento;
        } else {
          this.errorMessage = 'No se pudo obtener la información del usuario.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar los datos: ' + err.message;
        console.error(err);
      }
    });
  }

  guardarCambios(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Por favor, completa correctamente todos los campos obligatorios.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    //mapeamos exactamente lo que espera tu "UsuarioRequestDTO" en el backend
    const dtoData = {
      idUsuario: this.usuario.idUsuario,
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      email: this.usuario.email,
      claveActual: this.usuario.claveActual || "", // si no cambian clave enviamos vacío o string
      nuevaClave: this.usuario.nuevaClave || ""
    };

    this.usuarioService.editarUsuario(dtoData).subscribe({
      next: (resp: any) => {
        this.isSaving = false;
        
        // Validamos la respuesta estructurada de tu ApiResponse de Java
        if (resp.status === 'OK') {
          this.successMessage = resp.mensaje || 'Datos actualizados correctamente.';
          //limpiamos los campos de contrasenias por seguridad
          this.usuario.claveActual = '';
          this.usuario.nuevaClave = '';
        } else {
          this.errorMessage = resp.mensaje || 'Error al actualizar los datos.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Error en el servidor al guardar cambios: ' + err.message;
        console.error(err);
      }
    });
  }
}