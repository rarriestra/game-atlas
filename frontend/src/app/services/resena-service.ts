import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Resena } from '../models/resena.model';

const baseUrl = '/api/resenas/';

@Injectable({ providedIn: 'root' })
export class ResenaService {
  constructor(private readonly http: HttpClient) {}

  // Todas las reseñas de un juego (ficha)
  getDeJuego(videojuegoId: number): Observable<Resena[]> {
    return this.listar(new HttpParams().set('videojuego', videojuegoId));
  }

  // Todas las reseñas de un usuario (perfil)
  getDeUsuario(usuarioId: number): Observable<Resena[]> {
    return this.listar(new HttpParams().set('usuario', usuarioId));
  }

  // Las últimas N de toda la comunidad (inicio, CU03)
  getUltimas(cantidad: number): Observable<Resena[]> {
    return this.listar(new HttpParams().set('limite', cantidad));
  }

  // CU06: crear
  crear(usuarioId: number, videojuegoId: number, texto: string): Observable<Resena> {
    return this.http.post<ApiResponse<Resena>>(baseUrl, { usuario: usuarioId, videojuego_id: videojuegoId, texto })
      .pipe(map(res => res.data));
  }

  // CU07: editar (solo cambia el texto)
  editar(id: number, texto: string): Observable<Resena> {
    return this.http.patch<ApiResponse<Resena>>(`${baseUrl}${id}/`, { texto })
      .pipe(map(res => res.data));
  }

  // CU08: eliminar
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }

  // private: lo usan los tres get de arriba, para no repetir el mismo código
  private listar(params: HttpParams): Observable<Resena[]> {
    return this.http.get<ApiResponse<Resena[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }
}
