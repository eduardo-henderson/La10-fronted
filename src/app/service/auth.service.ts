import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
// behaviorsubject para mantener el estado de autenticacion en tiempo real
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // url base: usamos las rutas absolutas que comienzan en /api porque
  // el proxy (proxy.conf.json) ya redirige /api -> http://localhost:8081/la10
  // evitamos duplicar '/api' en las rutas.
  private apiUrl = '';
  private tokenKey = 'auth_token';
  // behaviorsubject para mantener el estado de autenticacion en tiempo real
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  // observable para que otros componentes puedan suscribirse al estado de autenticacion ej ande el agregarespacio
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  constructor(private http: HttpClient) {}

  /**
   * Extrae el ID del usuario decodificando el JWT almacenado en localStorage
   * @returns El ID numérico del usuario o 0 si no es válido
   */
  getUsuarioId(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      //un JWT se compone de: Header.Payload.Signature. Tomamos el Payload (posicion 1)
      const base64Url = token.split('.')[1];
      //ajustar posibles caracteres especiales de Base64URL a Base64
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      //decodificamos el string binario y lo transformamos en objeto JSON
      const payload = JSON.parse(window.atob(base64));

      console.log('JWT PAYLOAD DECODIFICADO:', payload); // DEBUG

      // Buscamos la propiedad del ID. Dependiendo de cómo lo firme tu backend,
      // suele venir como 'idUsuario', 'id', 'userId' o 'sub'.
      return payload.idUsuario || payload.id || payload.userId || 0;
    } catch (error) {
      console.error('Error al decodificar el token JWT:', error);
      return 0;
    }
  }

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
        console.log('LOGIN RESPONSE:', response); // 🔥 debug

        // backend devuelve { token: "...", message: "..." }
        const token = response?.token;

        if (typeof token === 'string' && token.trim()) {
          this.setToken(token);
          this.isAuthenticatedSubject.next(true);

          // si backend no devuelve el rol explicitamente, intentar inferirlo desde el token
          if (response?.tipoUsuario) {
            localStorage.setItem('user_role', response.tipoUsuario);
          } else {
            this.setRoleFromTokenIfMissing();
          }
        }
      }),
    );
  }

  /**
   * intenta extraer el rol del payload del jwt y lo guarda en localstorage
   * si aun no existe `user_role` en el almacenamiento.
   */
  setRoleFromTokenIfMissing(): void {
    try {
      const existing = this.getRole();
      if (existing) return;

      const token = this.getToken();
      if (!token) return;

      const payload = token.split('.').length >= 2 ? token.split('.')[1] : null;
      if (!payload) return;

      // atob puede lanzar excepcion si el payload no esta en base64 correcto
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

      // buscar posibles nombres de claim que contengan rol
      const candidates = [
        decoded.tipoUsuario,
        decoded.role,
        decoded.roles,
        decoded.rol,
        decoded.authorities,
        decoded.authority,
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'],
      ];

      for (const c of candidates) {
        if (!c) continue;
        // si es array, tomar el primer elemento
        const val = Array.isArray(c) ? c[0] : c;
        if (typeof val === 'string' && val.trim()) {
          localStorage.setItem('user_role', String(val));
          console.log('[authservice] role inferred from token=', val);
          return;
        }
      }
    } catch (e) {
      console.warn('no se pudo inferir role desde token:', e);
    }
  }

  /**
   * registra un nuevo usuario
   * @param usuario datos del usuario
   * @returns observable con el usuario creado
   */
  registro(usuario: any): Observable<any> {
    // ruta al backend a traves del proxy: /api/version1/usuarios/registro
    return this.http.post<any>(`/api/version1/usuarios/registro`, usuario);
  }

  // agregue esta funcion para comunicar la edicion con tu endpoint put del backend usando el proxy
  editarUsuario(usuario: any): Observable<any> {
    return this.http.put<any>(`/api/version1/usuarios/editar`, usuario);
  }

  /**
   * guarda el token jwt en localstorage
   * @param token token jwt
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * obtiene el token jwt del localstorage
   * @returns token jwt o null
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * verifica si existe un token valido
   * @returns true si existe token, false si no
   */
  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * cierra sesion y limpia el token
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user_role');
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * obtiene el estado de autenticacion actual
   * @returns true si esta autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getRole(): string | null {
    return localStorage.getItem('user_role'); // devuelve el rol del usuario almacenado en localstorage, o null si no existe
  }

  isAdmin(): boolean {
    const role = this.getRole();
    if (!role) {
      // intentar inferir desde token
      this.setRoleFromTokenIfMissing();
    }
    const finalRole = this.getRole();
    if (!finalRole) return false;

    const r = finalRole.toString().toUpperCase();
    return r === 'ADMINISTRADOR' || r === 'ADMIN' || r === 'ROLE_ADMIN' || r.includes('ADMIN');
  }
}
