import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
// BehaviorSubject para mantener el estado de autenticación en tiempo real
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // URL base: usamos las rutas absolutas que comienzan en /api porque
  // el proxy (proxy.conf.json) ya redirige /api -> http://localhost:8081/la10
  // Evitamos duplicar '/api' en las rutas.
  private apiUrl = '';
  private tokenKey = 'auth_token';
  // BehaviorSubject para mantener el estado de autenticación en tiempo real
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  // Observable para que otros componentes puedan suscribirse al estado de autenticación ej ande el agregarespacio
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  constructor(private http: HttpClient) {}

  /**
   * Realiza login con cédula y contraseña
   * @param usuario Cédula del usuario
   * @param password Contraseña
   * @returns Observable con la respuesta del login (contiene el token)
   */
  login(usuario: string, password: string): Observable<any> {
    const params = new HttpParams().set('usuario', usuario).set('password', password);

    return this.http.post<any>(`/api/version1/seguridad/login`, {}, { params }).pipe(
      tap((response) => {
        console.log('LOGIN RESPONSE:', response); // 🔥 DEBUG

        //BACKEND DEVUELVE { token: "...", message: "..." }
        const token = response?.token;

        if (typeof token === 'string' && token.trim()) {
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
   * @param usuario Datos del usuario
   * @returns Observable con el usuario creado
   */
  registro(usuario: any): Observable<any> {
    // Ruta al backend a través del proxy: /api/version1/usuarios/registro
    return this.http.post<any>(`/api/version1/usuarios/registro`, usuario);
  }

  /**
   * Guarda el token JWT en localStorage
   * @param token Token JWT
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Obtiene el token JWT del localStorage
   * @returns Token JWT o null
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verifica si existe un token válido
   * @returns true si existe token, false si no
   */
  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Cierra sesión y limpia el token
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user_role');
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtiene el estado de autenticación actual
   * @returns true si está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getRole(): string | null {
    return localStorage.getItem('user_role'); // Devuelve el rol del usuario almacenado en localStorage, o null si no existe
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMINISTRADOR';
  }
}
