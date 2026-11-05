import { Component, DoCheck, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BibliotecaItem, ESTADOS, ESTADOS_CALIFICABLES, Estado } from '../../models/biblioteca-item.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-biblioteca-panel',
  imports: [FormsModule],
  templateUrl: './biblioteca-panel.html',
  styleUrl: './biblioteca-panel.css'
})
export class BibliotecaPanel implements DoCheck {
  // @Input: dato que le pasa el componente "padre" (la ficha): <app-biblioteca-panel [videojuegoId]="...">
  @Input({ required: true }) videojuegoId!: number;
  // @Output: evento que el panel le avisa al padre, para que recargue el promedio
  @Output() cambio = new EventEmitter<void>();

  item?: BibliotecaItem;        // undefined = este usuario no tiene el juego en su biblioteca
  readonly estados = ESTADOS;
  readonly puntajes = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  private usuarioCargado: number | undefined | null = null;   // null = todavía no cargó nada

  constructor(
    private readonly bibliotecaService: BibliotecaService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // ngDoCheck se ejecuta cada vez que Angular revisa la pantalla.
  // Lo usamos para recargar el panel cuando cambian el usuario en la navbar
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      this.usuarioCargado = usuarioId;
      this.cargar();
    }
  }

  // CU04: el puntaje solo se habilita con Jugando, Completado o Abandonado
  get puedeCalificar(): boolean {
    return !!this.item && ESTADOS_CALIFICABLES.includes(this.item.estado);
  }

  cargar(): void {
    this.item = undefined;
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;   // visitante: no hay biblioteca
    this.bibliotecaService.getItem(usuarioId, this.videojuegoId)
      .subscribe(item => this.item = item);
  }

  // Alta: se toca uno de los 4 botones de estado
  agregar(estado: Estado): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (!usuarioId) return;
    this.bibliotecaService.agregar(usuarioId, this.videojuegoId, estado).subscribe({
      next: (item) => {
        this.item = item;
        this.toastr.success('Agregado a tu biblioteca');
      },
      error: () => this.toastr.error('No se pudo agregar')
    });
  }

  // Modificación del estado (CU04). Si pasa a Pendiente, el puntaje se conserva pero queda bloqueado
  cambiarEstado(estado: Estado): void {
    if (!this.item) return;
    this.bibliotecaService.actualizar(this.item.id, { estado }).subscribe({
      next: (item) => {
        this.item = item;
        this.cambio.emit();   // avisa a la ficha para que recargue el promedio
      },
      error: () => this.toastr.error('No se pudo cambiar el estado')
    });
  }

  // CU05: calificar del 1 al 10 (null = sacar el puntaje)
  calificar(puntaje: number | null): void {
    if (!this.item) return;
    this.bibliotecaService.actualizar(this.item.id, { puntaje }).subscribe({
      next: (item) => {
        this.item = item;
        this.toastr.success(puntaje ? `Calificaste con ${puntaje}` : 'Puntaje quitado');
        this.cambio.emit();
      },
      error: () => this.toastr.error('No se pudo guardar el puntaje')
    });
  }

  // Baja
  quitar(): void {
    if (!this.item) return;
    this.bibliotecaService.quitar(this.item.id).subscribe({
      next: () => {
        this.item = undefined;
        this.toastr.success('Quitado de tu biblioteca');
        this.cambio.emit();
      },
      error: () => this.toastr.error('No se pudo quitar')
    });
  }
}
