import { Routes } from '@angular/router';
import { LayoutComponent } from './views/layout/layout';
import { HomeComponent } from './views/general/home/home';
import { LoginComponent } from './views/auth/login/login';
import { RegistroEspacioComponent } from './views/espacios/registro-espacio/registro-espacio';
import { ReservasComponent } from './views/reservas/reservas';
import { Disponibilidad } from './views/disponibilidad/disponibilidad';
import { RegistroComponent } from './views/registroUsuario/registro';
import { AdminComponent } from './views/admin/admin';

export const routes: Routes = [
  // Sin layout
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'admin', component: AdminComponent },

  // Con layout
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'registro-espacio', component: RegistroEspacioComponent },
      { path: 'espacios', component: RegistroEspacioComponent },
      { path: 'reservas', component: ReservasComponent },
      { path: 'disponibilidad', component: Disponibilidad },
    ],
  },
];
