import { Component, DoCheck, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Sancion } from '../../models/moderacion.model';
import { ModeracionService } from '../../services/moderacion-service';
import { SesionService } from '../../services/sesion-service';

// Las sanciones de un usuario. Solo las ven él mismo y los moderadores
@Component({
  selector: 'app-sanciones-usuario',
  imports: [DatePipe],
  templateUrl: './sanciones-usuario.html',
  styleUrl: './sanciones-usuario.css'
})
export class SancionesUsuario implements DoCheck {
  @Input({ required: true }) usuarioId!: number;

  sanciones: Sancion[] = [];
  private claveCargada = '';

  constructor(
    private readonly moderacionService: ModeracionService,
    readonly sesion: SesionService
  ) {}

  // Depende de dos cosas: de quién es el perfil y quién mira. Si cambia cualquiera, se recarga
  ngDoCheck(): void {
    const yo = this.sesion.usuarioActual?.id;
    const clave = `${this.usuarioId}-${yo}`;
    if (clave === this.claveCargada) return;
    this.claveCargada = clave;
    this.sanciones = [];
    if (yo && (yo === this.usuarioId || this.sesion.esAdmin)) {
      this.moderacionService.getSanciones(this.usuarioId, yo).subscribe(data => this.sanciones = data);
    }
  }

  get esMiPerfil(): boolean {
    return this.sesion.usuarioActual?.id === this.usuarioId;
  }

  // La suspensión que está corriendo ahora (para el cartel de arriba)
  get suspension(): Sancion | undefined {
    return this.sanciones.find(s => s.vigente);
  }
}
