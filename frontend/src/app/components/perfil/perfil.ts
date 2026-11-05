import { Component, DoCheck, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BibliotecaItem, ESTADOS, Estado } from '../../models/biblioteca-item.model';
import { Resena } from '../../models/resena.model';
import { PerfilUsuario, Usuario } from '../../models/usuario.model';
import { BibliotecaService } from '../../services/biblioteca-service';
import { ResenaService } from '../../services/resena-service';
import { SesionService } from '../../services/sesion-service';
import { UsuarioService } from '../../services/usuario-service';
import { ListasUsuario } from '../listas-usuario/listas-usuario';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, DatePipe, DecimalPipe, ListasUsuario],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, DoCheck {
  usuario?: PerfilUsuario;   // NUEVO (Guía 10): con seguidores, siguiendo y lo_sigo
  biblioteca: BibliotecaItem[] = [];
  resenas: Resena[] = [];
  readonly estados = ESTADOS;
  mensaje = '';
  mostrarLista?: 'seguidores' | 'siguiendo';   // NUEVO: qué lista se está viendo
  lista: Usuario[] = [];                         // NUEVO
  private id = 0;
  private yoCargado?: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly usuarioService: UsuarioService,
    private readonly bibliotecaService: BibliotecaService,
    private readonly resenaService: ResenaService,
    readonly sesion: SesionService   // NUEVO: para saber quién mira (botón Seguir)
  ) {}

  ngOnInit(): void {
    // paramMap.subscribe (y no snapshot): si pasás del perfil de un usuario al de otro,
    // Angular reusa el mismo componente y solo cambia el :id; así nos enteramos
    this.route.paramMap.subscribe(params => this.cargar(Number(params.get('id'))));
  }

  // NUEVO: si cambian el usuario de la navbar, hay que recalcular "lo sigo"
  ngDoCheck(): void {
    const yo = this.sesion.usuarioActual?.id;
    if (this.id && yo !== this.yoCargado) {
      this.cargarPerfil();
    }
  }

  cargar(id: number): void {
    this.id = id;
    this.mensaje = '';
    this.mostrarLista = undefined;
    this.cargarPerfil();
    this.bibliotecaService.getDeUsuario(id).subscribe(data => this.biblioteca = data);
    this.resenaService.getDeUsuario(id).subscribe(data => this.resenas = data);
  }

  // NUEVO: el perfil con los contadores, desde el punto de vista de quien mira
  cargarPerfil(): void {
    this.yoCargado = this.sesion.usuarioActual?.id;
    this.usuarioService.getPerfil(this.id, this.yoCargado).subscribe({
      next: (data) => this.usuario = data,
      error: () => this.mensaje = 'El usuario no existe.'
    });
  }

  // CU19 / CU20
  seguir(): void {
    const yo = this.sesion.usuarioActual?.id;
    if (!yo || !this.usuario) return;
    this.usuarioService.toggleSeguir(this.id, yo).subscribe(res => {
      if (!this.usuario) return;
      this.usuario.lo_sigo = res.lo_sigo;
      this.usuario.seguidores = res.seguidores;
      // si la lista de seguidores está abierta, se vuelve a pedir para que aparezcas (o desaparezcas)
      if (this.mostrarLista === 'seguidores') {
        this.usuarioService.getLista(this.id, 'seguidores').subscribe(data => this.lista = data);
      }
    });
  }

  // Abre (o cierra, si ya estaba abierta) la lista de seguidores o de seguidos
  verLista(tipo: 'seguidores' | 'siguiendo'): void {
    if (this.mostrarLista === tipo) {
      this.mostrarLista = undefined;
      return;
    }
    this.mostrarLista = tipo;
    this.usuarioService.getLista(this.id, tipo).subscribe(data => this.lista = data);
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
