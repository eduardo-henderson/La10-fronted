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
        this.cdr.detectChanges();
      } catch (e) {}
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
    { texto: 'Tus reservas', ruta: '/reservas', icono: 'bi bi-journal-check', soloLogueado: true },
    {
      texto: 'Administrar Espacios',
      ruta: '/registro-espacio',
      icono: 'bi bi-clipboard-plus',
      soloAdmin: true,
    },
    {
      texto: 'Reservas activas',
      ruta: '/reservas-globales',
      icono: 'bi bi-clipboard-data',
      soloAdmin: true,
    },
    {
      texto: 'Usuarios',
      ruta: '/usuarios',
      icono: 'bi bi-people',
      soloAdmin: true,
    },
    {
      texto: 'Promo Packs',
      ruta: '/promos',
      icono: 'bi bi-box-seam',
      soloAdmin: true,
    },
    {
      texto: 'Contacto e Información',
      ruta: '/contacto-informacion',
      icono: 'bi bi-info-circle',
    },
  ];

  get itemsGenerales(): ItemMenu[] {
    const logueado = this.auth.isAuthenticated();
    return this.itemsMenu.filter((item) => !item.soloAdmin && (!item.soloLogueado || logueado));
  }

  get itemsAdmin(): ItemMenu[] {
    if (!this.auth.isAdmin()) {
      return [];
    }
    return this.itemsMenu.filter((item) => item.soloAdmin);
  }

  get estaLogueado(): boolean {
    return this.auth.isAuthenticated();
  }

  get esadmin(): boolean {
    return this.auth.isAdmin();
  }

  get nombreUsuario(): string {
    return this.auth.getNombreUsuario();
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
