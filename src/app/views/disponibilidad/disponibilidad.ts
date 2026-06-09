import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // 👈 Asegúrate de que Location esté aquí
import { Router } from '@angular/router';
import { EspacioService } from '../../service/espacio';
import { EspacioDisponibilidad } from '../../models/espacio-disponibilidad.model';

@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disponibilidad.html',
  styleUrls: ['./disponibilidad.css'],
})
export class Disponibilidad implements OnInit {

  espacios: EspacioDisponibilidad[] | null = null;
  tipoSeleccionado: string = 'CANCHA'; // esta variable es la que extraña el HTML

  constructor(
    private espacioService: EspacioService,
    private cdr: ChangeDetectorRef,
    private location: Location, // inyectado para volver atras
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad() {
    this.espacios = null; 
    
    this.espacioService.getDisponibilidadHoy(this.tipoSeleccionado)
      .subscribe({
        next: (data) => {
          console.log(`Datos recibidos para ${this.tipoSeleccionado}:`, data);
          this.espacios = data;
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          console.error('Error al conectar con el backend:', err);
        }
      });
  }

  // este metodo es el que extraña tu HTML
  cambiarFiltro(nuevoTipo: string) {
    if (this.tipoSeleccionado !== nuevoTipo) {
      this.tipoSeleccionado = nuevoTipo;
      this.cargarDisponibilidad();
    }
  }

  // metodo para volver a la página anterior usando Location
  volver() {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}