import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
//import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Reserva } from '../models/reserva.model';
import { NuevaReserva } from '../models/ocupacion.model';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private apiUrl = '/api/version1/reservas';

  constructor(private http: HttpClient) {}

  //cancelar reserva
  cancelarReserva(reserva: any): Observable<any> {
    //mandamos el objeto reserva completo (que incluye idReserva y motivoCanc)
    return this.http
      .put<any>(`/api/version1/reservas/cancelar`, reserva)
      .pipe(catchError((err) => this.handleError(err)));
  }

  //obtiene la ocupacion (MEDIA / COMPLETA) de todos los espacios en un rango de fechas
  obtenerReservasActivas(): Observable<any> {
    //interceptor.ts añade automaticamente tu token Bearer
    return this.http
      .get<any>(`/api/version1/reservas/obtenerreservasactivas`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  disponibilidad(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/disponibilidad`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  reservar(reserva: Reserva): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reservar`, reserva).pipe(
      timeout(10000),
      catchError((err) => this.handleError(err)),
    );
  }

  crearReserva(payload: NuevaReserva): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reservar`, payload).pipe(
      timeout(10000),
      catchError((err) => this.handleError(err)),
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la solicitud de reservas.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage =
            'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
          break;
        case 400:
          errorMessage = `Solicitud inválida: ${error.error?.message || 'Revisa los datos enviados.'}`;
          break;
        case 401:
          errorMessage = 'No autenticado. Por favor inicia sesión.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no existe.';
          break;
        case 500:
          errorMessage = `Error del servidor: ${error.error?.message || 'Intenta más tarde.'}`;
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Error en ReservaService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
