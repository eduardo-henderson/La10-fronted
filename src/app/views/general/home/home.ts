import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  // aca armo el menu que muestro cuando el usuario no esta logeado
  unauthenticatedMenu = [
    { text: 'Iniciar sesión', path: '/login', icon: 'bi bi-shield-lock' },
    { text: 'Registrarse', path: '/registro', icon: 'bi bi-person-plus' },
    { text: 'Registrar Espacio', path: '/registro-espacio', icon: 'bi bi-building-add' },
    { text: 'Reservas', path: '/reservas', icon: 'bi bi-calendar-event' },
    { text: 'Disponibilidad', path: '/disponibilidad', icon: 'bi bi-clock-history' }
  ];

  // aca armo las opciones que va a ver el usuario que ya inicio sesion
  authenticatedMenu = [
    { text: 'Registrar espacio', path: '/registro-espacio', icon: 'bi bi-building-add' },
    { text: 'Reservas', path: '/reservas', icon: 'bi bi-calendar-event' },
    { text: 'Disponibilidad', path: '/disponibilidad', icon: 'bi bi-clock-history' },
    { text: 'Cerrar sesión', path: '/home', icon: 'bi bi-power', action: 'logout' }
  ];

  // inyecto mi servicio de autenticacion para poder verificar el estado del token
  constructor(public authService: AuthService) {}

  // con este getter decido que menu renderizar en el html segun si esta logeado o no
  get menu() {
    return this.authService.isAuthenticated() ? this.authenticatedMenu : this.unauthenticatedMenu;
  }

  // aca hago el control clave: si esta logeado lo dejo pasar a su pantalla, 
  // si no esta logeado lo obligo a ir directo al login sin importar que boton toque
  getLink(path: string): string {
    return this.authService.isAuthenticated() ? path : '/login';
  }

  // aca controlo el click y si el boton tiene la accion de logout limpio la sesion
  handleClick(item: any): void {
    if (item.action === 'logout') {
      this.authService.logout();
    }
  }

  // con esto controlo si tengo que mostrar o no los avisos de advertencia en el html
  get shouldWarnLogin(): boolean {
    return !this.authService.isAuthenticated();
  }
}

