import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Lista } from '../models/lista.model';

const baseUrl = '/api/listas/';

@Injectable({ providedIn: 'root' })
export class ListaService {
  constructor(private readonly http: HttpClient) {}

  // Las listas de un usuario (perfil y ficha)
  getDeUsuario(usuarioId: number): Observable<Lista[]> {
    const params = new HttpParams().set('usuario', usuarioId);
    return this.http.get<ApiResponse<Lista[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }

  get(id: number): Observable<Lista> {
    return this.http.get<ApiResponse<Lista>>(`${baseUrl}${id}/`)
      .pipe(map(res => res.data));
  }

  // CU09: crear. videojuegosIds permite crearla con juegos ya adentro (desde la ficha)
  crear(usuarioId: number, nombre: string, descripcion = '', videojuegosIds: number[] = []): Observable<Lista> {
    return this.http.post<ApiResponse<Lista>>(baseUrl,
      { usuario: usuarioId, nombre, descripcion, videojuegos_ids: videojuegosIds })
      .pipe(map(res => res.data));
  }

  // CU10: editar nombre y descripción
  editar(id: number, datos: { nombre: string; descripcion: string }): Observable<Lista> {
    return this.http.patch<ApiResponse<Lista>>(`${baseUrl}${id}/`, datos)
      .pipe(map(res => res.data));
  }

  // CU11: eliminar
  eliminar(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }

  // CU10: agregar o quitar un juego (interruptor, como el like)
  toggleJuego(id: number, videojuegoId: number): Observable<{ en_lista: boolean; cantidad: number }> {
    return this.http.post<ApiResponse<{ en_lista: boolean; cantidad: number }>>(
      `${baseUrl}${id}/videojuegos/`, { videojuego: videojuegoId })
      .pipe(map(res => res.data));
  }
}
