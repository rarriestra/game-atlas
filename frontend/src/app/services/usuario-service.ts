import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PerfilUsuario, Usuario } from '../models/usuario.model';
import { ApiResponse } from '../models/videojuego.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private readonly http: HttpClient) {}

  // Solo lectura: trae los usuarios para el desplegable
  getAll(): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>('/api/usuarios/')
      .pipe(map(res => res.data));
  }

  // NUEVO: un usuario por id (perfil)
  get(id: number): Observable<Usuario> {
    return this.http.get<ApiResponse<Usuario>>(`/api/usuarios/${id}/`)
      .pipe(map(res => res.data));
  }

  // NUEVO (Guía 10): el perfil con seguidores. yo = quién mira, para saber si ya lo sigue
  getPerfil(id: number, yo?: number): Observable<PerfilUsuario> {
    let params = new HttpParams();
    if (yo) params = params.set('yo', yo);
    return this.http.get<ApiResponse<PerfilUsuario>>(`/api/usuarios/${id}/`, { params })
      .pipe(map(res => res.data));
  }

  // NUEVO: CU19 / CU20 (interruptor: sigue o deja de seguir)
  toggleSeguir(id: number, seguidorId: number): Observable<{ lo_sigo: boolean; seguidores: number }> {
    return this.http.post<ApiResponse<{ lo_sigo: boolean; seguidores: number }>>(`/api/usuarios/${id}/seguir/`, { seguidor: seguidorId })
      .pipe(map(res => res.data));
  }

  // NUEVO: lista de seguidores o de seguidos
  getLista(id: number, lista: 'seguidores' | 'siguiendo'): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>(`/api/usuarios/${id}/${lista}/`)
      .pipe(map(res => res.data));
  }
}