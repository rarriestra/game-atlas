import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../service/videojuego-service';

@Component({
  selector: 'app-videojuego-details',
  imports: [FormsModule, RouterLink],
  templateUrl: './videojuego-details.html',
  styleUrl: './videojuego-details.css'
})
export class VideojuegoDetails implements OnInit {
  videojuego?: Videojuego;
  mensaje = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly videojuegoService: VideojuegoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.videojuegoService.get(id).subscribe({
      next: (data) => this.videojuego = data,
      error: () => this.mensaje = 'El videojuego no existe.'
    });
  }

  actualizar(): void {
    if (!this.videojuego?.id) return;
    if (!this.videojuego.fecha_lanzamiento) {
      this.videojuego.fecha_lanzamiento = null;
    }
    this.videojuegoService.update(this.videojuego.id, this.videojuego).subscribe({
      next: (data) => {
        this.videojuego = data;
        this.mensaje = 'Cambios guardados.';
      },
      error: () => this.mensaje = 'No se pudo guardar. Revisá los datos.'
    });
  }

  eliminar(): void {
    if (!this.videojuego?.id || !confirm('¿Eliminar este videojuego?')) return;
    this.videojuegoService.delete(this.videojuego.id).subscribe({
      next: () => this.router.navigate(['/videojuegos']),
      error: () => this.mensaje = 'No se pudo eliminar.'
    });
  }
}