import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';   // para hacer pedidos HTTP
import { Observable, map } from 'rxjs';                // Observable : respuesta que llega después; map = transformarla
import { Genero } from '../models/genero.model';
import { ApiResponse } from '../models/videojuego.model'; // la forma { status, data }

// providedIn: 'root': hay un solo GeneroService para toda la app y cualquier componente lo puede pedir en su constructor
@Injectable({ providedIn: 'root' })
export class GeneroService {
  // Angular nos pasa el HttpClient solo (inyección de dependencias)
  constructor(private readonly http: HttpClient) {}

  // Trae todos los géneros (para llenar el select del formulario)
  getAll(): Observable<Genero[]> {
    // GET a /api/generos/ el proxy lo manda a Django
    return this.http.get<ApiResponse<Genero[]>>('/api/generos/')
      // Django responde { status, data: [...] }: nos quedamos solo con data
      .pipe(map(res => res.data));
  }
}