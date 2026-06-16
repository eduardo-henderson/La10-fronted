import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

interface ItemMenu {
  texto: string;
  ruta: string;
  icono: string;
  soloLogueado?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class LayoutComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);
  menuPerfilAbierto = false;

  // items del sidebar, los "soloLogueado" se muestran solo si el usuario está logueado
  itemsMenu: ItemMenu[] = [
    { texto: 'Canchas', ruta: '/disponibilidad', icono: 'bi bi-calendar2-check' },
    { texto: 'Tus reservas', ruta: '/reservas', icono: 'bi bi-bookmark-star', soloLogueado: true },
  ];

  get itemsVisibles(): ItemMenu[] {
    const logueado = this.auth.isAuthenticated();
    return this.itemsMenu.filter((item) => !item.soloLogueado || logueado);
  }

  get estaLogueado(): boolean {
    return this.auth.isAuthenticated();
  }

  alternarMenuPerfil(): void {
    this.menuPerfilAbierto = !this.menuPerfilAbierto;
  }

  // cerrar con click afuera del dropdown
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
