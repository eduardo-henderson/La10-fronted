import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private baseUrl = 'http://localhost:8080/la10/api/version1/usuarios';

  constructor(private http: HttpClient) {}

  // Nota: Lo ideal es que el Token lo maneje un Interceptor de Angular,
  // pero te dejo cómo armar los headers manualmente si lo necesitas rápido.
  private getHeaders(): HttpHeaders {
    // Aquí idealmente recuperas el token desde tu AuthService
    const token = localStorage.getItem('token') || 'TU_TOKEN_BEARER_AQUI'; 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener usuario: envía el ID directamente en el body
  getUsuario(idUsuario: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/getusuario`, idUsuario, { headers: this.getHeaders() });
  }

  // Editar usuario: envía el objeto UsuarioRequestDTO mediante PUT
  editarUsuario(usuarioData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/editar`, usuarioData, { headers: this.getHeaders() });
  }
}