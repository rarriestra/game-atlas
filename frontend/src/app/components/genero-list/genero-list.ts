import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Genero } from '../../models/genero.model';
import { GeneroService } from '../../services/genero-service';

@Component({
  selector: 'app-genero-list',
  imports: [FormsModule, NgClass],
  templateUrl: './genero-list.html',
  styleUrl: './genero-list.css'
})
export class GeneroList implements OnInit {
  generos: Genero[] = [];   // lo que muestra la tabla
  genero = new Genero();    // lo que está en el formulario de alta
  editandoId?: number;      // id de la fila que se está editando (undefined = ninguna)
  nombreEditado = '';       // lo que está en el campo de la fila que se edita
  guardando = false;        // true mientras hay un alta o modificación en curso: evita enviarla dos veces
  eliminando = false;       // true mientras se están borrando los seleccionados
  seleccionados = new Set<number>();   // ids de las filas tildadas
  mensaje = '';             // error fijo si Django no responde

  // Angular llama a este setter cuando aparece el campo de edición: le pasamos el foco
  @ViewChild('campoEdicion') set campoEdicion(campo: ElementRef<HTMLInputElement> | undefined) {
    campo?.nativeElement.focus();
  }

  constructor(
    private readonly generoService: GeneroService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  // Trae la lista desde Django y la pone en la tabla
  cargar(): void {
    this.generoService.getAll().subscribe({
      next: (data) => {
        this.generos = data;
        this.mensaje = '';
      },
      error: () => this.mensaje = 'No se pudo conectar con el servidor.'
    });
  }

  // Alta desde el formulario de arriba
  agregar(): void {
    const nombre = this.genero.nombre.trim();   // trim() saca espacios de los costados
    if (!nombre || this.guardando) return;
    this.guardando = true;
    this.generoService.create({ nombre })
      .pipe(finalize(() => this.guardando = false))   // finalize corre tanto si salió bien como si falló
      .subscribe({
        next: () => {
          this.toastr.success('Género creado');
          this.genero = new Genero();   // limpia el formulario
          this.cargar();                // recarga la tabla
        },
        error: () => this.toastr.error('No se pudo guardar')
      });
  }

  // Convierte la fila en un campo editable con el nombre actual
  editar(genero: Genero): void {
    this.editandoId = genero.id;
    this.nombreEditado = genero.nombre;
  }

  // Vuelve la fila a como estaba, sin guardar
  cancelar(): void {
    this.editandoId = undefined;
    this.nombreEditado = '';
  }

  // Modificación de la fila que se está editando
  guardarEdicion(): void {
    const nombre = this.nombreEditado.trim();
    if (!nombre || !this.editandoId || this.guardando) return;
    this.guardando = true;
    this.generoService.update(this.editandoId, { nombre })
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.toastr.success('Género modificado');
          this.cancelar();   // cierra la edición de la fila
          this.cargar();
        },
        error: () => this.toastr.error('No se pudo guardar')
      });
  }

  // Tilda o destilda una fila
  alternarSeleccion(id: number): void {
    if (this.seleccionados.has(id)) {
      this.seleccionados.delete(id);
    } else {
      this.seleccionados.add(id);
    }
  }

  // true si todas las filas están tildadas (para el checkbox del encabezado)
  get todosSeleccionados(): boolean {
    return this.generos.length > 0 && this.seleccionados.size === this.generos.length;
  }

  // Checkbox del encabezado: tilda todas o, si ya estaban todas, las destilda
  alternarTodos(): void {
    this.seleccionados = this.todosSeleccionados
      ? new Set()
      : new Set(this.generos.map(g => g.id!));
  }

  // Baja con confirmación de SweetAlert (asíncrona: la respuesta llega en el .then)
  eliminar(genero: Genero): void {
    Swal.fire({
      title: '¿Eliminar género?',
      text: `Se va a borrar "${genero.nombre}" y se va a sacar de los videojuegos que lo tengan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed || !genero.id) return;
      const id = genero.id;
      this.generoService.delete(id).subscribe({
        next: () => {
          this.toastr.success('Género eliminado');
          if (this.editandoId === id) this.cancelar();   // si lo estabas editando, cierra la edición
          this.seleccionados.delete(id);
          this.cargar();
        },
        error: () => this.toastr.error('No se pudo eliminar')
      });
    });
  }

  // Baja de todas las filas tildadas
  eliminarSeleccionados(): void {
    const ids = [...this.seleccionados];
    const nombres = this.generos.filter(g => this.seleccionados.has(g.id!)).map(g => g.nombre).join(', ');
    Swal.fire({
      title: '¿Eliminar los géneros seleccionados?',
      text: `Se va a borrar: ${nombres}. También se van a sacar de los videojuegos que los tengan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((resultado) => {
      if (!resultado.isConfirmed || this.eliminando) return;
      this.eliminando = true;
      // La API borra de a uno: forkJoin espera a que terminen todos los pedidos.
      // catchError hace que si uno falla no se corten los demás
      forkJoin(ids.map(id => this.generoService.delete(id).pipe(
        map(() => true),
        catchError(() => of(false))
      ))).subscribe(resultados => {
        const fallaron = ids.filter((_, i) => !resultados[i]);
        const eliminados = ids.length - fallaron.length;
        if (eliminados) this.toastr.success(`Géneros eliminados: ${eliminados}`);
        if (fallaron.length) this.toastr.error(`No se pudieron eliminar: ${fallaron.length}`);
        if (this.editandoId && ids.includes(this.editandoId) && !fallaron.includes(this.editandoId)) this.cancelar();
        this.seleccionados = new Set(fallaron);   // los que fallaron quedan tildados para reintentar
        this.eliminando = false;
        this.cargar();
      });
    });
  }
}
