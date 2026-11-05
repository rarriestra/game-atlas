import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Idioma } from '../models/idioma.model';
import { ApiResponse } from '../models/videojuego.model';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  constructor(private readonly http: HttpClient) {}

  // Solo lectura: trae los idiomas para el desplegable del catálogo
  getAll(): Observable<Idioma[]> {
    return this.http.get<ApiResponse<Idioma[]>>('/api/idiomas/')
      .pipe(map(res => res.data));
  }
}
