import { Component, DoCheck, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Lista } from '../../models/lista.model';
import { ListaService } from '../../services/lista-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-listas-panel',
  imports: [FormsModule, RouterLink],
  templateUrl: './listas-panel.html',
  styleUrl: './listas-panel.css'
})
export class ListasPanel implements DoCheck {
  @Input({ required: true }) videojuegoId!: number;

  listas: Lista[] = [];      // las listas del usuario elegido en la navbar
  nombreNueva = '';          // lo que se escribe en "Nueva lista"
  private usuarioCargado: number | undefined | null = null;   // null = todavía no cargó nada

  constructor(
    private readonly listaService: ListaService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // Igual que el panel de biblioteca: recarga si cambian el usuario de la navbar
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      this.usuarioCargado = usuarioId;
      this.listas = [];
      if (usuarioId) {
        this.listaService.getDeUsuario(usuarioId).subscribe(data => this.listas = data);
      }
    }
  }

  // true si este juego ya está en esa lista (el chip aparece relleno)
  contiene(lista: Lista): boolean {
    return lista.videojuegos.some(v => v.id === this.videojuegoId);
  }

  // CU10: tocar el chip agrega o quita el juego de la lista
  alternar(lista: Lista): void {
    this.listaService.toggleJuego(lista.id, this.videojuegoId).subscribe({
      next: (res) => {
        // Solo se actualiza el array en pantalla: se agrega un "marcador" con el id, o se filtra
        lista.videojuegos = res.en_lista
          ? [...lista.videojuegos, { id: this.videojuegoId, titulo: '', portada_url: '' }]
          : lista.videojuegos.filter(v => v.id !== this.videojuegoId);
        this.toastr.success(res.en_lista ? `Agregado a "${lista.nombre}"` : `Quitado de "${lista.nombre}"`);
      },
      error: () => this.toastr.error('No se pudo actualizar la lista')
    });
  }

  // CU09: crear una lista nueva que ya incluye este juego
  crear(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    const nombre = this.nombreNueva.trim();
    if (!usuarioId || !nombre) return;
    this.listaService.crear(usuarioId, nombre, '', [this.videojuegoId]).subscribe({
      next: (lista) => {
        this.listas = [lista, ...this.listas];
        this.nombreNueva = '';
        this.toastr.success(`Lista "${lista.nombre}" creada`);
      },
      // El mensaje de Django ("Ya tenés una lista con ese nombre.") viene en err.error.data.nombre
      error: (err) => this.toastr.error(err.error?.data?.nombre?.[0] ?? 'No se pudo crear la lista')
    });
  }
}
