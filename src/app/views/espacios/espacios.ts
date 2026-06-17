import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EspacioService } from '../../service/espacio';
import { Espacio } from '../../models/espacio.model';

@Component({
  selector: 'app-espacios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './espacios.html',
  styleUrls: ['./espacios.css'],
})
export class EspaciosComponent implements OnInit {
  private espacioService = inject(EspacioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  espacios: Espacio[] = [];
  cargando = false;
  mensajeError = '';

  ngOnInit(): void {
    this.cargarEspacios();
  }

  cargarEspacios(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.espacioService.getEspacios().subscribe({
      next: (datos) => {
        this.espacios = datos.filter((e) => e.habilitado);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = 'No se pudieron cargar los espacios. ' + (err.message || '');
        this.cdr.detectChanges();
      },
    });
  }

  get canchas(): Espacio[] {
    return this.espacios.filter((e) => e.tipo === 'CANCHA');
  }

  get salones(): Espacio[] {
    return this.espacios.filter((e) => e.tipo === 'SALON');
  }

  detalle(espacio: Espacio): string {
    const tipo = espacio.tipo === 'CANCHA' ? 'Cancha' : 'Salón';
    return tipo + ' con capacidad de ' + espacio.capacidad + ' personas';
  }

  abrirEspacio(espacio: Espacio): void {
    if (!espacio.idEspacio) {
      return;
    }
    this.router.navigate(['/espacios', espacio.idEspacio]);
  }
}
