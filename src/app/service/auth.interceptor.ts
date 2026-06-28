import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * HTTP Interceptor que adjunta el token JWT a todas las peticiones
 * Este interceptor automáticamente añade el header "Authorization: Bearer <token>"
 * a todas las peticiones HTTP (excepto las que ya lo tengan)
 */
export const authInterceptor = (
  request: HttpRequest<any>,
  next: (request: HttpRequest<any>) => Observable<HttpEvent<any>>,
): Observable<HttpEvent<any>> => {
  const token = localStorage.getItem('auth_token');
  console.log(
    '[authInterceptor] token from localStorage =',
    token ? `${String(token).slice(0, 20)}...` : 'NULL/EMPTY',
  );
  console.log('[authInterceptor] url =', request.url);

  const isValidToken = (t: string | null): t is string => {
    return !!t && t !== 'null' && t !== 'undefined';
  };

  // Evitar adjuntar token en endpoints de seguridad/registro o si ya exista Authorization
  const isAuthEndpoint =
    request.url.includes('/seguridad/login') ||
    request.url.includes('/usuarios/registro') ||
    request.url.includes('api.cloudinary.com');
  const hasAuthHeader = request.headers.has('Authorization');

  console.log(
    '[authInterceptor] isAuthEndpoint=',
    isAuthEndpoint,
    ', hasAuthHeader=',
    hasAuthHeader,
    ', isValidToken=',
    isValidToken(token),
  );

  if (isValidToken(token) && !isAuthEndpoint && !hasAuthHeader) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('[authInterceptor] ✓ Authorization header ATTACHED');
  } else {
    console.log(
      '[authInterceptor] ✗ Authorization header NOT attached (reason: validToken=' +
        isValidToken(token) +
        ' || isAuthEndpoint=' +
        isAuthEndpoint +
        ' || hasAuthHeader=' +
        hasAuthHeader +
        ')',
    );
  }
  const url = request.url;
  // Procesar la petición
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos error 401, limpiar el token
      if (error.status === 401) {
        console.log(' 401 recibido, PERO no borro token (debug)');
        // solo si NO es login
        if (!url.includes('/seguridad/login')) {
          localStorage.removeItem('auth_token');
        }
      }

      // Dejar que el componente maneje el 403 para mostrar la alerta en el mismo formato de la app.
      return throwError(() => error);
    }),
  );
};
