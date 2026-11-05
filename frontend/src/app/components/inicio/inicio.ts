import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Resena } from '../../models/resena.model';
import { Videojuego } from '../../models/videojuego.model';
import { ResenaService } from '../../services/resena-service';
import { VideojuegoService } from '../../services/videojuego-service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DatePipe, DecimalPipe, SlicePipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  recientes: Videojuego[] = [];   // los últimos juegos agregados al catálogo
  resenas: Resena[] = [];         // CU03: actividad reciente de la comunidad

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly resenaService: ResenaService
  ) {}

  ngOnInit(): void {
    this.videojuegoService.getRecientes(8).subscribe(data => this.recientes = data);
    this.resenaService.getUltimas(5).subscribe(data => this.resenas = data);
  }
}
