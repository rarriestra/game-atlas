import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Resena, RespuestaResena } from '../models/resena.model';

const baseUrl = '/api/resenas/';

@Injectable({ providedIn: 'root' })
export class ResenaService {
  constructor(private readonly http: HttpClient) {}

  // Todas las reseñas de un juego (ficha).
  // NUEVO: orden ('recientes' o 'votadas') y yo (quién mira, para saber si ya le dio like)
  getDeJuego(videojuegoId: number, orden = 'recientes', yo?: number): Observable<Resena[]> {
    let params = new HttpParams().set('videojuego', videojuegoId).set('orden', orden);
    if (yo) params = params.set('yo', yo);
    return this.listar(params);
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

  // NUEVO: dar o sacar like (interruptor). Devuelve la cantidad nueva y si quedó con like
  toggleLike(resenaId: number, usuarioId: number): Observable<{ likes: number; me_gusta: boolean }> {
    return this.http.post<ApiResponse<{ likes: number; me_gusta: boolean }>>(`${baseUrl}${resenaId}/like/`, { usuario: usuarioId })
      .pipe(map(res => res.data));
  }

  // NUEVO: responder una reseña
  responder(resenaId: number, usuarioId: number, texto: string): Observable<RespuestaResena> {
    return this.http.post<ApiResponse<RespuestaResena>>(`${baseUrl}${resenaId}/respuestas/`, { usuario: usuarioId, texto })
      .pipe(map(res => res.data));
  }

  // NUEVO: borrar una respuesta
  eliminarRespuesta(id: number): Observable<unknown> {
    return this.http.delete(`/api/respuestas/${id}/`);
  }

  // private: lo usan los tres get de arriba, para no repetir el mismo código
  private listar(params: HttpParams): Observable<Resena[]> {
    return this.http.get<ApiResponse<Resena[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }
}
