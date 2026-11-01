import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../service/videojuego-service';

@Component({
  selector: 'app-videojuego-list',
  imports: [RouterLink],
  templateUrl: './videojuego-list.html',
  styleUrl: './videojuego-list.css'
})
export class VideojuegoList implements OnInit {
  videojuegos: Videojuego[] = [];
  mensaje = '';

  constructor(private readonly videojuegoService: VideojuegoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.videojuegoService.getAll().subscribe({
      next: (data) => this.videojuegos = data,
      error: () => this.mensaje = 'No se pudo conectar con el servidor.'
    });
  }

  eliminar(id?: number): void { // ?: 
    if (!id || !confirm('¿Eliminar este videojuego?')) return;
    this.videojuegoService.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => this.mensaje = 'No se pudo eliminar.'
    });
  }
}