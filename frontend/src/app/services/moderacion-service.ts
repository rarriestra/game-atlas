import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Reporte, Sancion, TipoContenido, TipoSancion } from '../models/moderacion.model';

@Injectable({ providedIn: 'root' })
export class ModeracionService {
  constructor(private readonly http: HttpClient) {}

  // CU23: cualquier usuario
  reportar(reportanteId: number, tipo: TipoContenido, contenidoId: number, motivo: string): Observable<Reporte> {
    return this.http.post<ApiResponse<Reporte>>('/api/reportes/',
      { reportante: reportanteId, tipo, contenido_id: contenidoId, motivo })
      .pipe(map(res => res.data));
  }

  // CU24: solo moderador. resueltos = true trae el historial
  getReportes(moderadorId: number, resueltos = false): Observable<Reporte[]> {
    let params = new HttpParams().set('moderador', moderadorId);
    if (resueltos) params = params.set('estado', 'resueltos');
    return this.http.get<ApiResponse<Reporte[]>>('/api/reportes/', { params })
      .pipe(map(res => res.data));
  }

  // CU25: eliminar el contenido o descartar el reporte
  resolver(reporteId: number, moderadorId: number, accion: 'eliminar' | 'descartar'): Observable<Reporte> {
    return this.http.post<ApiResponse<Reporte>>(`/api/reportes/${reporteId}/resolver/`,
      { moderador: moderadorId, accion })
      .pipe(map(res => res.data));
  }

  // CU26: dias solo para la suspensión
  sancionar(moderadorId: number, datos: { usuario: number; tipo: TipoSancion; dias?: number; motivo: string; reporte?: number }): Observable<Sancion> {
    return this.http.post<ApiResponse<Sancion>>('/api/sanciones/', { moderador: moderadorId, ...datos })
      .pipe(map(res => res.data));
  }

  // Las sanciones de un usuario (las ve él mismo o un moderador)
  getSanciones(usuarioId: number, yo: number): Observable<Sancion[]> {
    const params = new HttpParams().set('usuario', usuarioId).set('yo', yo);
    return this.http.get<ApiResponse<Sancion[]>>('/api/sanciones/', { params })
      .pipe(map(res => res.data));
  }
}
