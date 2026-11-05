import { Injectable } from '@angular/core';
// HttpParams arma los filtros de la URL (?titulo=...&genero=...)
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, Videojuego , Pagina, Orden} from '../models/videojuego.model';


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
  // Pide una página del catálogo, con los mismos filtros que getAll
  // orden: los criterios elegidos; usuario: de quién son "mi puntaje" y "estado"
  getPagina(pagina: number, titulo = '', genero?: number, idioma?: number, orden: Orden[] = [], usuario?: number): Observable<Pagina<Videojuego>> {
    // 12 por página: se reparte justo en filas de 2, 4 o 6 tarjetas
    let params = new HttpParams().set('page', pagina).set('page_size', 12);
    if (titulo) params = params.set('titulo', titulo);
    if (genero) params = params.set('genero', genero);
    if (idioma) params = params.set('idioma', idioma);
    if (orden.length) {
      // → &ordenar=mi_puntaje:desc,titulo:asc
      params = params.set('ordenar', orden.map(o => `${o.campo}:${o.direccion}`).join(','));
    }
    if (usuario) params = params.set('usuario', usuario);
    // Acá no usamos map: necesitamos data, count y pages, no solo data
    return this.http.get<Pagina<Videojuego>>(baseUrl, { params });
  }
  // NUEVO: los últimos juegos agregados (inicio). Reusa la paginación: página 1 con N juegos
  getRecientes(cantidad: number): Observable<Videojuego[]> {
    const params = new HttpParams().set('orden', 'recientes').set('page', 1).set('page_size', cantidad);
    return this.http.get<Pagina<Videojuego>>(baseUrl, { params })
      .pipe(map(res => res.data));
  }
  // la API recibe los ids en generos_ids y plataformas_ids
  // private = solo se usa dentro de este servicio
  private paraEnviar(videojuego: Videojuego) {
    // Separa generos y plataformas (objetos) del resto de los campos (datos)
    const { generos, plataformas, ...datos } = videojuego; // ...datos son las propiedades restantes (titulo, sinopsis, fecha, etc.)
    return { // esto es lo que se manda a la API de Django
      ...datos,                                     // titulo, sinopsis, fecha, etc.
      generos_ids: generos.map(g => g.id),          // [{id:1, nombre:'RPG'}] → [1]
      plataformas_ids: plataformas.map(p => p.id)   // [{id:2, nombre:'PC'}] → [2]
    };
  }
}

/*
VIDEOJUEGO EN ANGULAR  
videojuego = {
  titulo 
  sinopsis
  generos: [{id:1, nombre:'RPG'}]
  plataformas: [{id:2, nombre:'PC'}, {id:3, nombre:'PS5'},  {id:4, nombre:'Switch'},  {id:5, nombre:'Xbox'}]
}

y DJANGO ESPERA RECIBIR
videojuego = {
  titulo 
  sinopsis
  generos_ids: [1]
  plataformas_ids: [2,3,4,5]
} 
Los campos se llaman generos_ids y plataformas_ids, no generos y plataformas.
Llevan solo los números (ids), no los objetos completos.

*/  