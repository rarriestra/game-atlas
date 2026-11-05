import { Component, DoCheck } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Actividad } from '../../models/actividad.model';
import { ActividadService } from '../../services/actividad-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-feed-actividad',
  imports: [RouterLink, DatePipe],
  templateUrl: './feed-actividad.html',
  styleUrl: './feed-actividad.css'
})
export class FeedActividad implements DoCheck {
  actividad: Actividad[] = [];
  soloSeguidos = false;      // false = Todos (CU03), true = Seguidos (CU21)
  private claveCargada = '';

  constructor(
    private readonly actividadService: ActividadService,
    readonly sesion: SesionService
  ) {}

  // Recarga si cambia la pestaña o el usuario de la navbar
  ngDoCheck(): void {
    // Sin usuario no hay "seguidos": vuelve a Todos
    if (!this.sesion.usuarioActual) this.soloSeguidos = false;
    const clave = `${this.sesion.usuarioActual?.id}-${this.soloSeguidos}`;
    if (clave !== this.claveCargada) {
      this.claveCargada = clave;
      const usuarioId = this.soloSeguidos ? this.sesion.usuarioActual?.id : undefined;
      this.actividadService.getActividad(usuarioId).subscribe(data => this.actividad = data);
    }
  }

  // A dónde lleva cada elemento: el tópico, o la ficha del juego
  enlace(a: Actividad): (string | number)[] {
    return a.tipo === 'topico' ? ['/topicos', a.id] : ['/videojuegos', a.videojuego.id];
  }
}
