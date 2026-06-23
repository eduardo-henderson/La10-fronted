import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private cloudName = 'domkgzikp';
  private uploadPreset = 'La10Preset';

  constructor(private http: HttpClient) {}

  // Devuelve url publica de cloudinary
  subirImagen(archivo: File): Observable<string> {
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post<any>(url, formData).pipe(map((res) => res.secure_url as string));
  }
}
