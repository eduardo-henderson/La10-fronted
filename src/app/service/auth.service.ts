import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '';
  private tokenKey = 'auth_token';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Extrae el ID del usuario de forma segura
   */
  getUsuarioId(): number {
    const token = this.getToken();
    if (!token) return 0;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadDecodificado = JSON.parse(atob(payloadBase64));
      return (
        payloadDecodificado.idUsuario ||
        payloadDecodificado.idusuario ||
        payloadDecodificado.id ||
        0
      );
    } catch (e) {
      console.error('Error al decodificar token', e);
      return 0;
    }
  }

  obtenerUsuario(id: number): Observable<any> {
    return this.http.post<any>(`/api/version1/usuarios/getusuario`, id);
  }

  /**
   * Realiza login con cédula y contraseña
   */
  login(usuario: string, password: string): Observable<any> {
    const params = new HttpParams().set('usuario', usuario).set('password', password);
    return this.http.post<any>(`/api/version1/seguridad/login`, {}, { params }).pipe(
      tap((response) => {
        const token = response?.token;
        if (token) {
          this.setToken(token);
          this.isAuthenticatedSubject.next(true);
          if (response?.tipoUsuario) {
            localStorage.setItem('user_role', response.tipoUsuario);
          }
        }
      }),
    );
  }

  /**
   * Registra un nuevo usuario
   */
  registro(usuario: any): Observable<any> {
    return this.http.post<any>(`/api/version1/usuarios/registro`, usuario);
  }

  /**
   * Envía los cambios de perfil adjuntando el token JWT Bearer de forma segura
   */
  editarUsuario(usuario: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`/api/version1/usuarios/editar`, usuario, { headers });
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user_role');
    localStorage.removeItem('usuario_actual');
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getRole(): string | null {
    return localStorage.getItem('user_role');
  }

  isAdmin(): boolean {
    const role = this.getRole();
    if (!role) return false;
    const r = role.toString().toUpperCase();
    return r === 'ADMINISTRADOR' || r === 'ADMIN' || r.includes('ADMIN');
  }
}
