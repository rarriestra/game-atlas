import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario.model';

// providedIn: 'root' = hay UNA sola instancia para toda la app.
// Por eso, si la navbar cambia el usuario, todas las pantallas ven el cambio.
@Injectable({ providedIn: 'root' })
export class SesionService {
  usuarioActual?: Usuario;   // undefined = todavía no eligió ninguno

  private readonly clave = 'gameatlas-usuario';   // nombre con el que se guarda en el navegador

  constructor() {
    // Al abrir la app, recupera el usuario elegido la última vez (si hay)
    const guardado = localStorage.getItem(this.clave);
    if (guardado) {
      this.usuarioActual = JSON.parse(guardado);   // texto → objeto
    }
  }

  // NUEVO: true solo si hay un usuario elegido y es administrador
  get esAdmin(): boolean {
    return !!this.usuarioActual?.is_staff;
  }

  // Cambia el usuario actual y lo guarda en el navegador.
  // localStorage solo guarda texto, por eso se usa JSON.stringify
  elegir(usuario?: Usuario): void {
    this.usuarioActual = usuario;
    if (usuario) {
      localStorage.setItem(this.clave, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(this.clave);
    }
  }
}