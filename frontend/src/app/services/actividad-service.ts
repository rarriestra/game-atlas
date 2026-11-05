import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/videojuego.model';
import { Actividad } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  constructor(private readonly http: HttpClient) {}

  // Sin usuario: toda la comunidad (CU03). Con usuario: solo la gente que sigue (CU21)
  getActividad(usuarioId?: number): Observable<Actividad[]> {
    let params = new HttpParams();
    if (usuarioId) params = params.set('usuario', usuarioId);
    return this.http.get<ApiResponse<Actividad[]>>('/api/actividad/', { params })
      .pipe(map(res => res.data));
  }
}
