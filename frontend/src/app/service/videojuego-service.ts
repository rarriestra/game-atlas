import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Videojuego } from '../models/videojuego.model';

const baseUrl = '/api/videojuegos/';

@Injectable({ providedIn: 'root' })
export class VideojuegoService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Videojuego[]> {
    return this.http.get<ApiResponse<Videojuego[]>>(baseUrl)
      .pipe(map(res => res.data));
  }

  get(id: number): Observable<Videojuego> {
    return this.http.get<ApiResponse<Videojuego>>(`${baseUrl}${id}/`)
      .pipe(map(res => res.data));
  }

  create(videojuego: Videojuego): Observable<Videojuego> {
    return this.http.post<ApiResponse<Videojuego>>(baseUrl, videojuego)
      .pipe(map(res => res.data));
  }

  update(id: number, videojuego: Partial<Videojuego>): Observable<Videojuego> {
    return this.http.patch<ApiResponse<Videojuego>>(`${baseUrl}${id}/`, videojuego)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}