import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Topico } from '../../models/foro.model';
import { ForoService } from '../../services/foro-service';
import { Videojuego } from '../../models/videojuego.model';
import { FeedActividad } from '../feed-actividad/feed-actividad';
import { VideojuegoService } from '../../services/videojuego-service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DecimalPipe, FeedActividad],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  recientes: Videojuego[] = [];   // los últimos juegos agregados al catálogo
  topicos: Topico[] = [];         // NUEVO (Guía 9): últimos tópicos de los foros

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly foroService: ForoService
  ) {}

  ngOnInit(): void {
    this.videojuegoService.getRecientes(8).subscribe(data => this.recientes = data);
    this.foroService.getTopicosRecientes(5).subscribe(data => this.topicos = data);
  }
}
