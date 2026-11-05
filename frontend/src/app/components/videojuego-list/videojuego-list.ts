import { Component, DoCheck, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'; // librería para mostrar alertas estilizadas
import { ESTADOS, Estado } from '../../models/biblioteca-item.model';
import { Genero } from '../../models/genero.model';
import { Idioma } from '../../models/idioma.model';
import { DireccionOrden, Orden, Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../services/videojuego-service';
import { GeneroService } from '../../services/genero-service';
import { SesionService } from '../../services/sesion-service';
import { BibliotecaService } from '../../services/biblioteca-service';
import { IdiomaService } from '../../services/idioma-service';

// Por qué se puede ordenar. personal = depende del usuario elegido, así que el visitante no lo ve.
// direccion = con cuál arranca al elegirlo: lo más lógico para cada campo
const CAMPOS_ORDEN: { valor: string; texto: string; personal: boolean; direccion: DireccionOrden }[] = [
  { valor: 'titulo', texto: 'Nombre', personal: false, direccion: 'asc' },
  { valor: 'promedio', texto: 'Puntaje general', personal: false, direccion: 'desc' },
  { valor: 'mi_puntaje', texto: 'Mi puntaje', personal: true, direccion: 'desc' },
  { valor: 'estado', texto: 'Estado', personal: true, direccion: 'asc' },
];

@Component({
  selector: 'app-videojuego-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './videojuego-list.html',
  styleUrl: './videojuego-list.css'
})
export class VideojuegoList implements OnInit, DoCheck {
  videojuegos: Videojuego[] = [];
  generos: Genero[] = [];
  busqueda = '';
  generoFiltro?: number;
  idiomas: Idioma[] = [];   // opciones del desplegable de idioma
  idiomaFiltro?: number;
  mensaje = '';
  pagina = 1;         // página actual
  totalPaginas = 1;   // lo dice Django
  total = 0;          // cantidad total de juegos encontrados
  estados = new Map<number, Estado>();   // id del juego → estado en la biblioteca del usuario elegido
  misPuntajes = new Map<number, number | null>();   // id del juego → puntaje que le puso ese usuario
  private usuarioCargado: number | undefined | null = null;   // null = todavía no cargó nada

  // Panel de orden: lo que se está eligiendo. Recién cuenta al tocar Aplicar
  panelOrden = false;
  primario = '';                            // '' = sin elegir
  dirPrimario: DireccionOrden = 'asc';
  secundario = '';
  dirSecundario: DireccionOrden = 'asc';
  ordenAplicado: Orden[] = [];              // lo que se le pide a Django
  private ordenCambiaConUsuario = false;    // true si el orden aplicado usa "Mi puntaje" o "Estado"

  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly generoService: GeneroService,
    private readonly toastr: ToastrService,
    readonly sesion: SesionService,   // NUEVO
    private readonly bibliotecaService: BibliotecaService,
    private readonly idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.generoService.getAll().subscribe(data => this.generos = data);
    this.idiomaService.getAll().subscribe(data => this.idiomas = data);
    this.cargar();
  }

  // Igual que en el panel: si cambian el usuario en la navbar, se traen sus estados
  ngDoCheck(): void {
    const usuarioId = this.sesion.usuarioActual?.id;
    if (usuarioId !== this.usuarioCargado) {
      const primeraVez = this.usuarioCargado === null;   // la primera carga ya la hizo ngOnInit
      this.usuarioCargado = usuarioId;
      if (!usuarioId) this.sacarOrdenPersonal();          // el visitante no tiene puntaje ni estado propios
      // "Mi puntaje" y "Estado" son de cada usuario: con otro usuario cambia el orden de la lista
      if (!primeraVez && this.ordenCambiaConUsuario) {
        this.ordenCambiaConUsuario = false;
        this.pagina = 1;
        this.cargar();
      }
      this.ordenCambiaConUsuario = this.ordenAplicado.some(o => this.esPersonal(o.campo));
      this.estados = new Map();
      this.misPuntajes = new Map();
      if (usuarioId) {
        this.bibliotecaService.getDeUsuario(usuarioId).subscribe(items => {
          this.estados = new Map(items.map(i => [i.videojuego.id, i.estado]));
          this.misPuntajes = new Map(items.map(i => [i.videojuego.id, i.puntaje]));
        });
      }
    }
  }

  // 'COMPLETADO' → 'Completado'; si el juego no está en su biblioteca, 'Sin estado'
  estadoDe(videojuego: Videojuego): string {
    const estado = this.estados.get(videojuego.id!);
    return ESTADOS.find(e => e.valor === estado)?.texto ?? 'Sin estado';
  }

    cargar(): void {
    this.videojuegoService.getPagina(this.pagina, this.busqueda, this.generoFiltro, this.idiomaFiltro,
      this.ordenAplicado, this.sesion.usuarioActual?.id).subscribe({
      next: (res) => {
        this.videojuegos = res.data;
        this.totalPaginas = res.pages;
        this.total = res.count;
        this.pagina = res.page;
        this.mensaje = '';
      },
      error: () => this.mensaje = 'No se pudo conectar con el servidor.'
    });
  }

  // ---------- Orden ----------

  private esPersonal(campo: string): boolean {
    return !!CAMPOS_ORDEN.find(c => c.valor === campo)?.personal;
  }

  // Las opciones del desplegable principal
  get camposOrden() {
    return CAMPOS_ORDEN.filter(c => !c.personal || this.sesion.usuarioActual);
  }

  // Las del secundario: las mismas, menos la que ya se eligió como principal
  get camposSecundarios() {
    return this.camposOrden.filter(c => c.valor !== this.primario);
  }

  // El texto del botón, por ejemplo "Mi puntaje ↓, Nombre ↑"
  get resumenOrden(): string {
    if (!this.ordenAplicado.length) return 'Nombre ↑';
    return this.ordenAplicado
      .map(o => `${CAMPOS_ORDEN.find(c => c.valor === o.campo)?.texto} ${o.direccion === 'asc' ? '↑' : '↓'}`)
      .join(', ');
  }

  private direccionInicial(campo: string): DireccionOrden {
    return CAMPOS_ORDEN.find(c => c.valor === campo)?.direccion ?? 'asc';
  }

  cambiarPrimario(campo: string): void {
    this.primario = campo;
    this.dirPrimario = this.direccionInicial(campo);
    // Sin principal no hay secundario, y los dos no pueden ser el mismo
    if (!campo || this.secundario === campo) this.secundario = '';
  }

  cambiarSecundario(campo: string): void {
    this.secundario = campo;
    this.dirSecundario = this.direccionInicial(campo);
  }

  // Pasa lo elegido a ordenAplicado y vuelve a pedir la lista, desde la primera página
  aplicarOrden(): void {
    this.ordenAplicado = [];
    if (this.primario) this.ordenAplicado.push({ campo: this.primario, direccion: this.dirPrimario });
    if (this.secundario) this.ordenAplicado.push({ campo: this.secundario, direccion: this.dirSecundario });
    this.ordenCambiaConUsuario = this.ordenAplicado.some(o => this.esPersonal(o.campo));
    this.panelOrden = false;
    this.pagina = 1;
    this.cargar();
  }

  limpiarOrden(): void {
    this.primario = '';
    this.secundario = '';
    this.aplicarOrden();
  }

  // Si queda como visitante, se sacan "Mi puntaje" y "Estado" (el secundario pasa a principal)
  private sacarOrdenPersonal(): void {
    if (this.secundario && this.esPersonal(this.secundario)) this.secundario = '';
    if (this.primario && this.esPersonal(this.primario)) {
      this.primario = this.secundario;
      this.dirPrimario = this.dirSecundario;
      this.secundario = '';
    }
    this.ordenAplicado = this.ordenAplicado.filter(o => !this.esPersonal(o.campo));
  }

  // [1, null, 48, 49, 50, 51, 52, null, 100] para dibujar un botón por página:
  // la primera, la última y las 5 más cercanas contando la actual. null = "…" (páginas salteadas)
  get paginas(): (number | null)[] {
    const total = this.totalPaginas;
    // Las 5 cercanas: min y max evitan que se pasen del principio o del final
    const inicio = Math.max(1, Math.min(this.pagina - 2, total - 4));
    const fin = Math.min(total, inicio + 4);

    const lista: (number | null)[] = [];
    if (inicio > 1) lista.push(1);
    // Si entre medio queda una sola página se muestra esa, porque "…" ocuparía el mismo lugar
    if (inicio === 3) lista.push(2);
    if (inicio > 3) lista.push(null);
    for (let p = inicio; p <= fin; p++) lista.push(p);
    if (fin < total - 2) lista.push(null);
    if (fin === total - 2) lista.push(total - 1);
    if (fin < total) lista.push(total);
    return lista;
  }

  // Cambia de página y se la pide a Django
  irA(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.pagina = p;
    this.cargar();
  }
  limpiar(): void {
    this.busqueda = '';
    this.generoFiltro = undefined; // undefined indica que no hay ningún género seleccionado
    this.idiomaFiltro = undefined;
    this.pagina = 1; // si no, al limpiar desde una página alta seguiría en esa página
    this.cargar(); 
  }
  nombres(lista: { nombre: string }[]): string {
    return lista.map(item => item.nombre).join(', '); // map() crea un nuevo array con los nombres de los géneros y join() los une en un string separados por comas
  }

  
  eliminar(videojuego: Videojuego): void {
    Swal.fire({
      title: '¿Eliminar este videojuego?',
      text: `Se va a borrar "${videojuego.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545', // rojo
    }).then((result) => {
      if (!result.isConfirmed || !videojuego.id) {
        return;
      }
      this.videojuegoService.delete(videojuego.id).subscribe({
        next: () => {
          this.toastr.success('Videojuego eliminado correctamente.');
          this.cargar(); // recarga la lista de videojuegos después de eliminar
        },
          error: () => this.toastr.error('No se pudo eliminar el videojuego.')
        });
      });
    }
 }
 