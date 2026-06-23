import { Routes } from '@angular/router';
import { LayoutComponent } from './views/layout/layout';
import { HomeComponent } from './views/general/home/home';
import { LoginComponent } from './views/auth/login/login';
import { RegistroEspacioComponent } from './views/espacios/registro-espacio/registro-espacio';
import { ReservasComponent } from './views/reservas/reservas';
import { ReservasGlobalesComponent } from './views/reservas/reservas-globales';
import { Disponibilidad } from './views/disponibilidad/disponibilidad';
import { RegistroComponent } from './views/registroUsuario/registro';
import { AdminComponent } from './views/admin/admin';
import { EspaciosComponent } from './views/espacios/espacios';
import { EspacioDetalleComponent } from './views/espacios/espacio-detalle/espacio-detalle';

// IMPORTACIÓN CORREGIDA: Apunta exactamente a tu archivo físico "editarusaurio"
import { EditarUsuarioComponent } from './views/editarUsuario/editarusuario'; 

export const routes: Routes = [
  // Rutas públicas (Sin diseño/layout de usuario logueado)
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'admin', component: AdminComponent },

  // Rutas privadas/protegidas (Con diseño/layout común)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: EspaciosComponent, pathMatch: 'full' },
      { path: 'home', component: EspaciosComponent },
      { path: 'registro-espacio', component: RegistroEspacioComponent },
      { path: 'reservas', component: ReservasComponent },
      { path: 'reservas-globales', component: ReservasGlobalesComponent },
      { path: 'disponibilidad', component: Disponibilidad },
      { path: 'espacios', component: EspaciosComponent }, 
      { path: 'espacios/:id', component: EspacioDetalleComponent },
      
      // RUTA CORREGIDA: Ahora abre tu componente independiente de edición
      { path: 'perfil', component: EditarUsuarioComponent },
    ],
  },
  
  // Ruta comodín por si escriben cualquier otra cosa en la URL
  { path: '**', redirectTo: 'home' }
];
