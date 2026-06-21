import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Espacio } from '../models/espacio.model';
import { EspacioDisponibilidad } from '../models/espacio-disponibilidad.model';
import { EspacioReservado } from '../models/ocupacion.model';

@Injectable({
  providedIn: 'root',
})
export class EspacioService {
  // Usamos el proxy definido en proxy.conf.json para evitar CORS y mantener la misma base de origen
  private apiUrl = '/api/version1/espacios';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los espacios existentes desde el backend
   * @returns Observable con array de espacios
   */
  getEspacios(): Observable<Espacio[]> {
    return this.http.get<any>(`${this.apiUrl}/listarTodos`).pipe(
      map((response: any) => {
        let espacios: any[] = [];

        if (Array.isArray(response)) {
          espacios = response;
        } else if (Array.isArray(response?.data)) {
          espacios = response.data;
        } else if (Array.isArray(response?.espacios)) {
          espacios = response.espacios;
        }

        // SOLO map basico (sin resolver relaciones aun)
        return espacios.map((item) => ({
          idEspacio: item.idEspacio,
          nombre: item.nombre,
          capacidad: item.capacidad,
          habilitado: item.habilitado,
          precioBase: item.precioBase,
          permiteMediaReserva: item.permiteMediaReserva,
          tipo: item.tipo,

          //importante: dejamos el ID guardado
          canchaAsociada: null,
          idCanchaAsociada: item.idCanchaAsociada,
        }));
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  /**
   * Obtiene un espacio específico por ID
   * @param id ID del espacio
   * @returns Observable con el espacio solicitado
   */
  obtenerEspacio(id: number): Observable<Espacio> {
    return this.http
      .get<Espacio>(`${this.apiUrl}/BuscarEspacioForId/${id}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Registra un nuevo espacio
   * @param espacio Datos del espacio a registrar
   * @returns Observable con el espacio creado
   */
  registrarEspacio(espacio: Espacio): Observable<Espacio> {
    return this.http
      .post<Espacio>(`${this.apiUrl}/Nuevoespacio`, espacio)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Actualiza un espacio existente
   * @param id ID del espacio
   * @param espacio Nuevos datos del espacio
   * @returns Observable con el espacio actualizado
   */
  actualizarEspacio(id: number, espacio: Espacio): Observable<Espacio> {
    return this.http
      .put<Espacio>(`${this.apiUrl}/${id}`, espacio)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Pone un espacio en mantenimiento (borrado lógico)
   * @param id ID del espacio
   * @returns Observable vacío
   */
  desactivarEspacio(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.apiUrl}/${id}/mantenimiento`, {})
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * Maneja errores HTTP y proporciona mensajes descriptivos
   * @param error Error HTTP
   * @returns Observable con error procesado
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la solicitud';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente o de red
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 0:
          errorMessage =
            'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
          break;
        case 400:
          errorMessage = `Solicitud inválida: ${error.error?.message || 'Revisa los datos enviados'}`;
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
          errorMessage = `Error del servidor: ${error.error?.message || 'Intenta más tarde'}`;
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Error en EspacioService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  getDisponibilidadHoy(tipo: string) {
    return this.http
      .get<EspacioDisponibilidad[]>(`${this.apiUrl}/disponibilidad/hoy?tipo=${tipo}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  obtenerOcupacionSemana(idEspacio: number, inicioSemana: string): Observable<EspacioReservado> {
    return this.http
      .get<EspacioReservado>(
        `${this.apiUrl}/${idEspacio}/ocupacion-semana?inicioSemana=${inicioSemana}`,
      )
      .pipe(catchError((err) => this.handleError(err)));
  }
}
