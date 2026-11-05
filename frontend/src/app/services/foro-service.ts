import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Comentario, RespuestaComentario, Topico, TopicoDetalle } from '../models/foro.model';

@Injectable({ providedIn: 'root' })
export class ForoService {
  constructor(private readonly http: HttpClient) {}

  // CU12: los tópicos del foro de un juego
  getTopicosDeJuego(videojuegoId: number): Observable<Topico[]> {
    const params = new HttpParams().set('videojuego', videojuegoId);
    return this.http.get<ApiResponse<Topico[]>>('/api/topicos/', { params }).pipe(map(res => res.data));
  }

  // Los últimos N tópicos de todo el sitio (inicio)
  getTopicosRecientes(cantidad: number): Observable<Topico[]> {
    const params = new HttpParams().set('limite', cantidad);
    return this.http.get<ApiResponse<Topico[]>>('/api/topicos/', { params }).pipe(map(res => res.data));
  }
  
  getDeUsuario(usuarioId: number): Observable<Topico[]> {
    const params = new HttpParams().set('usuario', usuarioId);
    return this.http.get<ApiResponse<Topico[]>>('/api/topicos/', { params }).pipe(map(res => res.data));
  }

  // CU12: un tópico con sus comentarios
  getTopico(id: number): Observable<TopicoDetalle> {
    return this.http.get<ApiResponse<TopicoDetalle>>(`/api/topicos/${id}/`).pipe(map(res => res.data));
  }

  // CU13
  crearTopico(usuarioId: number, videojuegoId: number, titulo: string, texto: string): Observable<Topico> {
    return this.http.post<ApiResponse<Topico>>('/api/topicos/', { usuario: usuarioId, videojuego_id: videojuegoId, titulo, texto })
      .pipe(map(res => res.data));
  }

  // CU14
  editarTopico(id: number, titulo: string, texto: string): Observable<Topico> {
    return this.http.patch<ApiResponse<Topico>>(`/api/topicos/${id}/`, { titulo, texto }).pipe(map(res => res.data));
  }

  // CU15
  eliminarTopico(id: number): Observable<unknown> {
    return this.http.delete(`/api/topicos/${id}/`);
  }

  // CU16: comentar (respuestaA = id del comentario al que responde, o null)
  comentar(topicoId: number, usuarioId: number, texto: string, respuestaA: number | null = null): Observable<Comentario> {
    return this.http.post<ApiResponse<Comentario>>(`/api/topicos/${topicoId}/comentarios/`,
      { usuario: usuarioId, texto, respuesta_a: respuestaA }).pipe(map(res => res.data));
  }

  // CU17
  editarComentario(id: number, texto: string): Observable<RespuestaComentario> {
    return this.http.patch<ApiResponse<RespuestaComentario>>(`/api/comentarios/${id}/`, { texto }).pipe(map(res => res.data));
  }

  // CU18
  eliminarComentario(id: number): Observable<unknown> {
    return this.http.delete(`/api/comentarios/${id}/`);
  }
}
