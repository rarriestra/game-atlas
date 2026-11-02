import { Injectable } from '@angular/core';
// HttpParams arma los filtros de la URL (?titulo=...&genero=...)
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Videojuego } from '../models/videojuego.model';

const baseUrl = '/api/videojuegos/';

@Injectable({ providedIn: 'root' })
export class VideojuegoService {
  constructor(private readonly http: HttpClient) {}

  // recibe filtros opcionales para el buscador
  getAll(titulo = '', genero?: number): Observable<Videojuego[]> {
    let params = new HttpParams();
    // Solo agrega el filtro si tiene valor (si no, trae todos)
    if (titulo) {
      params = params.set('titulo', titulo);   // → ?titulo=zelda
    }
    if (genero) {
      params = params.set('genero', genero);   // → &genero=3
    }
    // Django los lee con request.query_params en la vista
    return this.http.get<ApiResponse<Videojuego[]>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }

  get(id: number): Observable<Videojuego> {
    return this.http.get<ApiResponse<Videojuego>>(`${baseUrl}${id}/`)
      .pipe(map(res => res.data));
  }

  // no manda el videojuego tal cual, sino convertido con paraEnviar()
  create(videojuego: Videojuego): Observable<Videojuego> {
    return this.http.post<ApiResponse<Videojuego>>(baseUrl, this.paraEnviar(videojuego))
      .pipe(map(res => res.data));
  }

  update(id: number, videojuego: Videojuego): Observable<Videojuego> {
    return this.http.patch<ApiResponse<Videojuego>>(`${baseUrl}${id}/`, this.paraEnviar(videojuego))
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${baseUrl}${id}/`);
  }

  // la API recibe los ids en generos_ids y plataformas_ids
  // private = solo se usa dentro de este servicio
  private paraEnviar(videojuego: Videojuego) {
    // Separa generos y plataformas (objetos) del resto de los campos (datos)
    const { generos, plataformas, ...datos } = videojuego;
    return {
      ...datos,                                     // titulo, sinopsis, fecha, etc.
      generos_ids: generos.map(g => g.id),          // [{id:1, nombre:'RPG'}] → [1]
      plataformas_ids: plataformas.map(p => p.id)   // [{id:2, nombre:'PC'}] → [2]
    };
  }
}