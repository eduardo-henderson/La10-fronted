import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioAdmin {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  cedula: string;
  tipousuario: string;
  estadoUsuario: string;
}

export interface NuevoUsuarioPayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  cedula: string;
  contrasenia: string;
  tipousuario: string;
  estadoUsuario: string;
}

export interface EditarUsuarioPayload {
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  tipousuario: string;
  estadoUsuario: string;
  nuevaClave?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioAdminService {
  private http = inject(HttpClient);

  private base = '/api/version1/usuarios';

  listarTodos(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${this.base}/listarTodos`);
  }

  crear(payload: NuevoUsuarioPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/registro`, payload);
  }

  editar(payload: EditarUsuarioPayload): Observable<any> {
    return this.http.put<any>(`${this.base}/editar`, payload);
  }

  eliminar(idUsuario: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/eliminar/${idUsuario}`);
  }
}
