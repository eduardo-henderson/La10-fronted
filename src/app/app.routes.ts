import { Routes } from '@angular/router';
import { LayoutComponent } from './views/layout/layout';
import { HomeComponent } from './views/general/home/home';
import { LoginComponent } from './views/auth/login/login';
import { RegistroEspacioComponent } from './views/espacios/registro-espacio/registro-espacio';
import { ReservasComponent } from './views/reservas/reservas';
import { Disponibilidad } from './views/disponibilidad/disponibilidad';
import { RegistroComponent } from './views/registroUsuario/registro';
import { AdminComponent } from './views/admin/admin';
import { EspaciosComponent } from './views/espacios/espacios';
import { EspacioDetalleComponent } from './views/espacios/espacio-detalle/espacio-detalle';

export const routes: Routes = [
  // sin layout
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'admin', component: AdminComponent },

  // con layout
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: EspaciosComponent, pathMatch: 'full' },
      { path: 'home', component: EspaciosComponent },
      { path: 'registro-espacio', component: RegistroEspacioComponent },
      // { path: 'espacios', component: registroespaciocomponent },
      { path: 'reservas', component: ReservasComponent },
      { path: 'disponibilidad', component: Disponibilidad },
      { path: 'espacios', component: EspaciosComponent }, // grilla (era registroespaciocomponent)
      { path: 'espacios/:id', component: EspacioDetalleComponent },
      // agregue la ruta perfil aqui dentro para que se renderice con el menu y la barra superior
      { path: 'perfil', component: RegistroComponent },
    ],
  },
];
