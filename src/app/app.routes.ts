import { Routes } from '@angular/router';
import { HomeComponent } from './views/general/home/home';
import { LoginComponent } from './views/auth/login/login';
import { RegistroEspacioComponent } from './views/espacios/registro-espacio/registro-espacio';
import { ReservasComponent } from './views/reservas/reservas';
import { Disponibilidad } from './views/disponibilidad/disponibilidad';
import { RegistroComponent } from './views/registroUsuario/registro';
import { AdminComponent } from './views/admin/admin';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'registro-espacio', component: RegistroEspacioComponent },
  { path: 'espacios', component: RegistroEspacioComponent },
  { path: 'reservas', component: ReservasComponent },
  { path: 'disponibilidad', component: Disponibilidad },
  { path: 'admin', component: AdminComponent },
];
