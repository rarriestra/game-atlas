import { Component, DoCheck } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { BibliotecaItem, ESTADOS, ESTADOS_CALIFICABLES, Estado } from '../../models/biblioteca-item.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-biblioteca-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './biblioteca-list.html',
  styleUrl: './biblioteca-list.css'
})
export class BibliotecaList implements DoCheck {
  items: BibliotecaItem[] = [];               // toda la biblioteca del usuario
  filtro?: Estado;                            // pestaña elegida; undefined = Todos
  readonly estados = ESTADOS;
  readonly puntajes = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  private usuarioCargado: number | undefined | null = null;

  constructor(
    private readonly bibliotecaService: BibliotecaService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // Igual que en el panel: si cambian el usuario en la navbar, recarga
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      this.usuarioCargado = usuarioId;
      this.cargar();
    }
  }

  cargar(): void {
    this.items = [];
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.bibliotecaService.getDeUsuario(usuarioId).subscribe({
      next: (data) => this.items = data,
      error: () => this.toastr.error('No se pudo cargar la biblioteca')
    });
  }

  // Los items de la pestaña elegida
  get itemsFiltrados(): BibliotecaItem[] {
    return this.filtro ? this.items.filter(i => i.estado === this.filtro) : this.items;
  }

  // Para el número al lado de cada pestaña
  cantidad(estado?: Estado): number {
    return estado ? this.items.filter(i => i.estado === estado).length : this.items.length;
  }

  puedeCalificar(item: BibliotecaItem): boolean {
    return ESTADOS_CALIFICABLES.includes(item.estado);
  }

  // Modificación desde la tabla: estado o puntaje
  actualizar(item: BibliotecaItem, cambios: { estado?: Estado; puntaje?: number | null }): void {
    this.bibliotecaService.actualizar(item.id, cambios).subscribe({
      next: (actualizado) => {
        // reemplaza el item viejo por el que devolvió Django (así la tabla muestra lo mismo que la base)
        this.items = this.items.map(i => i.id === actualizado.id ? actualizado : i);
      },
      error: () => this.toastr.error('No se pudo guardar el cambio')
    });
  }

  // Baja con confirmación
  quitar(item: BibliotecaItem): void {
    Swal.fire({
      title: '¿Quitar de tu biblioteca?',
      text: `Se va a quitar "${item.videojuego.titulo}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.bibliotecaService.quitar(item.id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.toastr.success('Quitado de tu biblioteca');
        },
        error: () => this.toastr.error('No se pudo quitar')
      });
    });
  }
}
