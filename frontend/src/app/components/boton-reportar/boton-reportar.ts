import { Component, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { TipoContenido } from '../../models/moderacion.model';
import { ModeracionService } from '../../services/moderacion-service';
import { SesionService } from '../../services/sesion-service';

// Un botón "Reportar" que se pone al lado de cualquier reseña, tópico o comentario:
// <app-boton-reportar tipo="RESENA" [contenidoId]="r.id" [autorId]="r.usuario" />
@Component({
  selector: 'app-boton-reportar',
  imports: [],
  templateUrl: './boton-reportar.html',
  styleUrl: './boton-reportar.css'
})
export class BotonReportar {
  @Input({ required: true }) tipo!: TipoContenido;
  @Input({ required: true }) contenidoId!: number;
  @Input({ required: true }) autorId!: number;

  constructor(
    private readonly moderacionService: ModeracionService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService
  ) {}

  // Se muestra si hay usuario y el contenido no es suyo
  get visible(): boolean {
    const yo = this.sesion.usuarioActual?.id;
    return !!yo && yo !== this.autorId;
  }

  // CU23: pide el motivo en un cartel de SweetAlert y manda el reporte
  reportar(): void {
    const yo = this.sesion.usuarioActual?.id;
    if (!yo) return;
    Swal.fire({
      title: 'Reportar contenido',
      input: 'textarea',                       // SweetAlert también puede pedir un texto
      inputLabel: '¿Por qué es inapropiado?',
      inputPlaceholder: 'Insultos, spoilers sin aviso, spam...',
      showCancelButton: true,
      confirmButtonText: 'Enviar reporte',
      cancelButtonText: 'Cancelar',
      // Si devuelve un texto, SweetAlert lo muestra como error y no cierra
      inputValidator: (valor) => valor.trim().length < 5 ? 'Escribí un motivo (mínimo 5 caracteres).' : null
    }).then((resultado) => {
      if (!resultado.isConfirmed) return;
      this.moderacionService.reportar(yo, this.tipo, this.contenidoId, resultado.value).subscribe({
        next: () => this.toastr.success('Reporte enviado. Un moderador lo va a revisar.'),
        error: (err) => {
          // Django manda {data: {campo: ['mensaje']}}: se muestra el primer mensaje que haya
          const errores = Object.values(err.error?.data ?? {}) as string[][];
          this.toastr.error(errores[0]?.[0] ?? 'No se pudo enviar el reporte');
        }
      });
    });
  }
}
