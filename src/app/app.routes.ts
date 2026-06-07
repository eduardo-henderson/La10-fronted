import { Routes } from '@angular/router';
import { LoginComponent } from './views/auth/login/login';
import { RegistroEspacioComponent } from './views/espacios/registro-espacio/registro-espacio';
import { ReservasComponent } from './views/reservas/reservas';
import { Disponibilidad } from './views/disponibilidad/disponibilidad';
import { RegistroComponent } from './views/registroUsuario/registro';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'espacios', component: RegistroEspacioComponent },
  { path: 'registro-espacio', component: RegistroEspacioComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'reservas', component: ReservasComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'disponibilidad', component: Disponibilidad },
];


