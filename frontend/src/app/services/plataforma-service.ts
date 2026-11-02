import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Plataforma } from '../models/plataforma.model';
import { ApiResponse } from '../models/videojuego.model';

@Injectable({ providedIn: 'root' })
export class PlataformaService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Plataforma[]> {
    return this.http.get<ApiResponse<Plataforma[]>>('/api/plataformas/')
      .pipe(map(res => res.data));
  }
}