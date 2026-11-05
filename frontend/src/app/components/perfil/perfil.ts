import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BibliotecaItem, ESTADOS, Estado } from '../../models/biblioteca-item.model';
import { Resena } from '../../models/resena.model';
import { Usuario } from '../../models/usuario.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { ResenaService } from '../../services/resena-service';
import { UsuarioService } from '../../services/usuario-service';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, DatePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario?: Usuario;
  biblioteca: BibliotecaItem[] = [];
  resenas: Resena[] = [];
  readonly estados = ESTADOS;
  mensaje = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly usuarioService: UsuarioService,
    private readonly bibliotecaService: BibliotecaService,
    private readonly resenaService: ResenaService
  ) {}

  ngOnInit(): void {
    // paramMap.subscribe (y no snapshot): si pasás del perfil de un usuario al de otro,
    // Angular reusa el mismo componente y solo cambia el :id; así nos enteramos
    this.route.paramMap.subscribe(params => this.cargar(Number(params.get('id'))));
  }

  cargar(id: number): void {
    this.mensaje = '';
    this.usuarioService.get(id).subscribe({
      next: (data) => this.usuario = data,
      error: () => this.mensaje = 'El usuario no existe.'
    });
    this.bibliotecaService.getDeUsuario(id).subscribe(data => this.biblioteca = data);
    this.resenaService.getDeUsuario(id).subscribe(data => this.resenas = data);
  }

  // Cuántos juegos tiene en cada estado
  cantidad(estado: Estado): number {
    return this.biblioteca.filter(i => i.estado === estado).length;
  }

  // 'COMPLETADO' → 'Completado' (el texto lindo de la lista ESTADOS)
  textoEstado(estado: Estado): string {
    return ESTADOS.find(e => e.valor === estado)?.texto ?? estado;
  }

  // Promedio de los puntajes que puso este usuario
  get promedio(): number | null {
    const puntajes = this.biblioteca.filter(i => i.puntaje !== null).map(i => i.puntaje as number);
    if (puntajes.length === 0) return null;
    return puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
  }
}
