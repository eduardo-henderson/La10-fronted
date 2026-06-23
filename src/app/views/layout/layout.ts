import { Component, HostListener, inject, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

interface ItemMenu {
  texto: string;
  ruta: string;
  icono: string;
  soloLogueado?: boolean;
  soloAdmin?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  protected auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  menuPerfilAbierto = false;

  constructor() {
    this.auth.isAuthenticated$.subscribe(() => {
      try {
        // ejecucion asincrona diferida para evitar el error de ciclo de angular
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      } catch (e) {
        // ignore
      }
    });
  }

  ngOnInit(): void {
    // se fuerza una estabilizacion de la vista al inicializar el componente
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  itemsMenu: ItemMenu[] = [
    { texto: 'Espacios', ruta: '/espacios', icono: 'bi bi-calendar2-check' },
    { texto: 'Tus reservas', ruta: '/reservas', icono: 'bi bi-bookmark-star', soloLogueado: true },
    { texto: 'Registrar Espacio', ruta: '/registro-espacio', icono: 'bi bi-bookmark-star', soloAdmin: true },
    { texto: 'Editar Espacio', ruta: '/registro-espacio', icono: 'bi bi-pencil-square', soloAdmin: true },
    {
      texto: 'Disponibilidad',
      ruta: '/disponibilidad',
      icono: 'bi bi-calendar2-range',
      soloAdmin: true,
    },
  ];

  get itemsVisibles(): ItemMenu[] {
    const logueado = this.auth.isAuthenticated();
    const admin = this.auth.isAdmin();
    return this.itemsMenu.filter(
      (item) => (!item.soloLogueado || logueado) && (!item.soloAdmin || admin),
    );
  }

  get estaLogueado(): boolean {
    return this.auth.isAuthenticated();
  }

  get esadmin(): boolean {
    return this.auth.isAdmin();
  }

  alternarMenuPerfil(): void {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
  }

  @HostListener('document:click', ['$event'])
  cerrarSiClickAfuera(evento: MouseEvent): void {
    const objetivo = evento.target as HTMLElement;
    if (!objetivo.closest('.perfil-afuera')) {
      this.menuPerfilAbierto = false;
    }
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.menuPerfilAbierto = false;
    this.router.navigate(['/home']);
  }
}
