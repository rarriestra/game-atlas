import { Component, DoCheck } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Reporte, TipoSancion } from '../../models/moderacion.model';
import { ModeracionService } from '../../services/moderacion-service';
import { SesionService } from '../../services/sesion-service';

@Component({
  selector: 'app-moderacion',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './moderacion.html',
  styleUrl: './moderacion.css'
})
export class Moderacion implements DoCheck {
  reportes: Reporte[] = [];
  verResueltos = false;          // pestaña: false = Pendientes (CU24), true = Resueltos
  // Formulario de sanción (CU26): se abre debajo de un reporte
  sancionandoId?: number;        // id del reporte cuyo formulario está abierto
  tipoSancion: TipoSancion = 'ADVERTENCIA';
  dias = 3;
  motivoSancion = '';
  private claveCargada = '';

  constructor(
    private readonly moderacionService: ModeracionService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // Recarga si cambia la pestaña o el usuario de la navbar
  ngDoCheck(): void {
    const clave = `${this.sesion.usuarioActual?.id}-${this.verResueltos}`;
    if (clave !== this.claveCargada) {
      this.claveCargada = clave;
      this.cargar();
    }
  }

  cargar(): void {
    this.reportes = [];
    this.sancionandoId = undefined;
    const yo = this.sesion.usuarioActual?.id;
    if (!yo || !this.sesion.esAdmin) return;
    this.moderacionService.getReportes(yo, this.verResueltos).subscribe(data => this.reportes = data);
  }

  // A dónde lleva "Ver en contexto": el tópico, o la ficha del juego (donde están las reseñas)
  enlace(r: Reporte): (string | number)[] {
    if (!r.ubicacion) return [];
    return r.ubicacion.topico ? ['/topicos', r.ubicacion.topico] : ['/videojuegos', r.ubicacion.videojuego.id];
  }

  // CU25: eliminar el contenido (con confirmación) o descartar el reporte
  resolver(r: Reporte, accion: 'eliminar' | 'descartar'): void {
    const yo = this.sesion.usuarioActual?.id;
    if (!yo) return;
    const confirmar = accion === 'eliminar'
      ? Swal.fire({
          title: `¿Eliminar ${r.tipo_texto.toLowerCase()} de ${r.autor_nombre}?`,
          text: r.tipo === 'TOPICO' ? 'Se borran también todos sus comentarios.' : 'No se puede deshacer.',
          icon: 'warning', showCancelButton: true,
          confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#dc3545'
        }).then(res => res.isConfirmed)
      : Promise.resolve(true);   // descartar no pide confirmación
    confirmar.then(ok => {
      if (!ok) return;
      this.moderacionService.resolver(r.id, yo, accion).subscribe({
        next: () => {
          this.toastr.success(accion === 'eliminar' ? 'Contenido eliminado' : 'Reporte descartado');
          this.cargar();   // eliminar puede cerrar varios reportes a la vez: se recarga la lista
        },
        error: (err) => this.toastr.error(err.error?.data ?? 'No se pudo resolver')
      });
    });
  }

  // CU26: abre el formulario, con el motivo del reporte como punto de partida
  abrirSancion(r: Reporte): void {
    this.sancionandoId = r.id;
    this.tipoSancion = 'ADVERTENCIA';
    this.dias = 3;
    this.motivoSancion = r.motivo;
  }

  sancionar(r: Reporte): void {
    const yo = this.sesion.usuarioActual?.id;
    if (!yo) return;
    this.moderacionService.sancionar(yo, {
      usuario: r.autor,
      tipo: this.tipoSancion,
      dias: this.tipoSancion === 'SUSPENSION' ? this.dias : undefined,
      motivo: this.motivoSancion.trim(),
      reporte: r.id
    }).subscribe({
      next: (s) => {
        this.toastr.success(`${s.tipo_texto} aplicada a ${s.usuario_nombre}`);
        r.sanciones_autor++;
        this.sancionandoId = undefined;
      },
      error: (err) => {
        const errores = Object.values(err.error?.data ?? {}) as string[][];
        this.toastr.error(errores[0]?.[0] ?? 'No se pudo sancionar');
      }
    });
  }
}
