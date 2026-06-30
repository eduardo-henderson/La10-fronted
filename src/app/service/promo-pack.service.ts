import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromoPack } from '../models/promo-pack.model';

@Injectable({ providedIn: 'root' })
export class PromoPackService {
  private http = inject(HttpClient);
  private base = '/api/version1/promos';

  listarTodos(): Observable<PromoPack[]> {
    return this.http.get<PromoPack[]>(`${this.base}/listarTodos`);
  }

  disponibles(): Observable<PromoPack[]> {
    return this.http.get<PromoPack[]>(`${this.base}/disponibles`);
  }

  crear(pack: PromoPack): Observable<PromoPack> {
    return this.http.post<PromoPack>(`${this.base}/crear`, pack);
  }

  actualizar(pack: PromoPack): Observable<PromoPack> {
    return this.http.put<PromoPack>(`${this.base}/actualizar`, pack);
  }

  eliminar(idPp: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/eliminar/${idPp}`);
  }
}
