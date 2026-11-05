import { Component, DoCheck, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Topico } from '../../models/foro.model';
import { ForoService } from '../../services/foro-service';
import { Videojuego } from '../../models/videojuego.model';
import { FeedActividad } from '../feed-actividad/feed-actividad';
import { VideojuegoService } from '../../services/videojuego-service';
import { BibliotecaService } from '../../services/biblioteca-service';
import { SesionService } from '../../services/sesion-service';
import { Lista } from '../../models/lista.model';
import { ListaService } from '../../services/lista-service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DecimalPipe, DatePipe, FeedActividad],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit, DoCheck {
  recientes: Videojuego[] = [];   // los últimos juegos agregados al catálogo
  topicos: Topico[] = [];         // últimos tópicos de los foros
  listas: Lista[] = [];           // actividad reciente de listas

  // Contadores de la pastilla de estadísticas
  completados = 0;
  jugando     = 0;
  pendientes  = 0;
  private usuarioCargado?: number;   // de quién son los contadores que se están mostrando

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly foroService: ForoService,
    private readonly bibliotecaService: BibliotecaService,
    readonly sesion: SesionService,   // sin private: el html lo usa con @if (sesion.usuarioActual)
    private readonly listaService: ListaService
  ) {}

  ngOnInit(): void {
    this.videojuegoService.getRecientes(8).subscribe(data => this.recientes = data);
    this.foroService.getTopicosRecientes(5).subscribe(data => this.topicos = data);

    // Cargar listas recientes de todos los usuarios (máximo 5)
    this.listaService.getTodas().subscribe(data => this.listas = data.slice(0, 5));
  }

  // Igual que en Mi biblioteca: si cambian el usuario en la navbar, recarga
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      this.usuarioCargado = usuarioId;
      this.cargarEstadisticas(usuarioId);
    }
  }

  private cargarEstadisticas(usuarioId?: number): void {
    this.completados = 0;
    this.jugando     = 0;
    this.pendientes  = 0;
    if (!usuarioId) return;
    this.bibliotecaService.getDeUsuario(usuarioId).subscribe(items => {
      // Si cambiaron de usuario mientras esperábamos, esta respuesta ya no sirve
      if (usuarioId !== this.usuarioCargado) return;
      this.completados = items.filter(i => i.estado === 'COMPLETADO').length;
      this.jugando     = items.filter(i => i.estado === 'JUGANDO').length;
      this.pendientes  = items.filter(i => i.estado === 'PENDIENTE').length;
    });
  }

  // Detecta si se creó o se modificó comparando fecha de creación y actualización
  accionLista(l: Lista): string {
    const creada = new Date(l.creada).getTime();
    const actualizada = new Date(l.actualizada).getTime();
    return (actualizada - creada > 5000) ? 'modificó la lista' : 'creó la lista';
  }
}