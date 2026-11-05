import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Orden } from '../models/videojuego.model';
import { BibliotecaItem, Estado } from '../models/biblioteca-item.model';

const baseUrl = '/api/biblioteca/';

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  constructor(private readonly http: HttpClient) {}

  // Toda la biblioteca de un usuario (página "Mi biblioteca")
  getDeUsuario(usuarioId: number): Observable<BibliotecaItem[]> {
    const params = new HttpParams().set('usuario', usuarioId);
    return this.http.get<ApiResponse<BibliotecaItem[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }

  // La biblioteca con los filtros y el orden elegidos en "Mi biblioteca"
  getFiltrada(usuarioId: number, titulo = '', genero?: number, idioma?: number, orden: Orden[] = []): Observable<BibliotecaItem[]> {
    let params = new HttpParams().set('usuario', usuarioId);
    if (titulo) params = params.set('titulo', titulo);
    if (genero) params = params.set('genero', genero);
    if (idioma) params = params.set('idioma', idioma);
    if (orden.length) {
      // → &ordenar=mi_puntaje:desc,titulo:asc
      params = params.set('ordenar', orden.map(o => `${o.campo}:${o.direccion}`).join(','));
    }
    return this.http.get<ApiResponse<BibliotecaItem[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }

  // El item de UN juego para UN usuario (panel de la ficha).
  // Devuelve undefined si ese usuario todavía no lo agregó
  getItem(usuarioId: number, videojuegoId: number): Observable<BibliotecaItem | undefined> {
    const params = new HttpParams().set('usuario', usuarioId).set('videojuego', videojuegoId);
    return this.http.get<ApiResponse<BibliotecaItem[]>>(baseUrl, { params })
      .pipe(map(res => res.data[0]));
  }

  // Alta (CU04): agrega el juego con un estado
  agregar(usuarioId: number, videojuegoId: number, estado: Estado): Observable<BibliotecaItem> {
    return this.http.post<ApiResponse<BibliotecaItem>>(baseUrl, {
      usuario: usuarioId,
      videojuego_id: videojuegoId,
      estado
    }).pipe(map(res => res.data));
  }

  // Modificación: cambiar estado (CU04) y/o puntaje (CU05)
  actualizar(id: number, cambios: { estado?: Estado; puntaje?: number | null }): Observable<BibliotecaItem> {
    return this.http.patch<ApiResponse<BibliotecaItem>>(`${baseUrl}${id}/`, cambios)
      .pipe(map(res => res.data));
  }

  // Baja: quitar el juego de la biblioteca
  quitar(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }
}
