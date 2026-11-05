import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Plataforma } from '../models/plataforma.model';
import { ApiResponse } from '../models/videojuego.model';

const baseUrl = '/api/plataformas/'; // URL base para las plataformas, Django la maneja con el proxy de Angular
@Injectable({ providedIn: 'root' })
export class PlataformaService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Plataforma[]> {
    return this.http.get<ApiResponse<Plataforma[]>>('/api/plataformas/')
      .pipe(map(res => res.data));
  }
  create(plataforma: Partial<Plataforma>): Observable<Plataforma> {
    return this.http.post<ApiResponse<Plataforma>>(baseUrl, plataforma)
      .pipe(map(res => res.data));
  }

  update(id: number, plataforma: Partial<Plataforma>): Observable<Plataforma> {
    return this.http.patch<ApiResponse<Plataforma>>(`${baseUrl}${id}/`, plataforma)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}