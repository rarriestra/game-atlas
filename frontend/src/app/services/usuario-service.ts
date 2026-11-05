import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { ApiResponse } from '../models/videojuego.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private readonly http: HttpClient) {}

  // Solo lectura: trae los usuarios para el desplegable
  getAll(): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>('/api/usuarios/')
      .pipe(map(res => res.data));
  }
}