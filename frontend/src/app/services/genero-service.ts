import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';   // para hacer pedidos HTTP
import { Observable, map } from 'rxjs';                // Observable : respuesta que llega después; map = transformarla
import { Genero } from '../models/genero.model';
import { ApiResponse } from '../models/videojuego.model'; // la forma { status, data }

const baseUrl = '/api/generos/'; // URL base para los géneros, Django la maneja con el proxy de Angular

// providedIn: 'root': hay un solo GeneroService para toda la app y cualquier componente lo puede pedir en su constructor
@Injectable({ providedIn: 'root' })
export class GeneroService {
  // Angular nos pasa el HttpClient solo (inyección de dependencias)
  constructor(private readonly http: HttpClient) {}

  // Trae todos los géneros (para llenar el select del formulario)
  getAll(): Observable<Genero[]> {
    // GET a /api/generos/ el proxy lo manda a Django
    return this.http.get<ApiResponse<Genero[]>>('/api/generos/')
      // Django responde { status, data: [...] }: nos quedamos solo con data
      .pipe(map(res => res.data));
  }
  // alta → POST /api/generos/
  create(genero: Partial<Genero>): Observable<Genero> { // Partial<Genero> = puede venir con id o sin id
    return this.http.post<ApiResponse<Genero>>(baseUrl, genero)
      .pipe(map(res => res.data));
  }

  // modificación → PATCH /api/generos/5/
  update(id: number, genero: Partial<Genero>): Observable<Genero> {
    return this.http.patch<ApiResponse<Genero>>(`${baseUrl}${id}/`, genero)
      .pipe(map(res => res.data));
  }

  // baja → DELETE /api/generos/5/
  delete(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}