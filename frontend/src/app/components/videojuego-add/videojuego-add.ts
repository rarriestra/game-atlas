import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importa FormsModule para usar ngModel en el formulario
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Genero } from '../../models/genero.model';
import { Plataforma } from '../../models/plataforma.model';
import { Videojuego } from '../../models/videojuego.model';
import { VideojuegoService } from '../../services/videojuego-service';
import { GeneroService } from '../../services/genero-service';
import { PlataformaService } from '../../services/plataforma-service';

@Component({
  selector: 'app-videojuego-add',
  imports: [FormsModule, RouterLink, NgClass],
  templateUrl: './videojuego-add.html',
  styleUrl: './videojuego-add.css'
})
export class VideojuegoAdd implements OnInit { // export class VideojuegoAdd para poder usarlo en otros archivos (clase cerrada)
  videojuego = new Videojuego();
  generos: Genero[] = [];
  plataformas: Plataforma[] = []
  // mensaje = '' no hace falta porque se usa ToastrService para mostrar mensajes de error o éxito 
  constructor(
    private readonly videojuegoService: VideojuegoService,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly generoService: GeneroService,
    private readonly plataformaService: PlataformaService
  ) {}
  // ngOnInit() es un método del ciclo de vida del componente que se ejecuta después de que Angular inicializa las propiedades vinculadas a datos del componente. Se usa para inicializar datos o realizar tareas de configuración.
  ngOnInit(): void {  
    this.generoService.getAll().subscribe(data => this.generos = data);
    this.plataformaService.getAll().subscribe(data => this.plataformas = data);
  }

  tieneGenero(genero: Genero): boolean { // método para verificar si el videojuego tiene un género seleccionado
    return this.videojuego.generos.some(g => g.id === genero.id); // some() devuelve true si al menos un elemento del array cumple la condición. Compara los ids de los géneros del videojuego con el id del género pasado como parámetro.
  }

  alternarGenero(genero: Genero): void { // método para agregar o quitar un género del videojuego
    this.videojuego.generos = this.tieneGenero(genero) // si el videojuego ya tiene el género, lo quita; si no, lo agrega
      ? this.videojuego.generos.filter(g => g.id !== genero.id) // filter() devuelve un nuevo array con los elementos que cumplen la condición. Compara los ids de los géneros del videojuego con el id del género pasado como parámetro.
      : [...this.videojuego.generos, genero]; // ... es el operador spread que copia los elementos del array y agrega el nuevo género al final.
  }

  tienePlataforma(plataforma: Plataforma): boolean { // método para verificar si el videojuego tiene una plataforma seleccionada
    return this.videojuego.plataformas.some(p => p.id === plataforma.id); // some() devuelve true si al menos un elemento del array cumple la condición. Compara los ids de las plataformas del videojuego con el id de la plataforma pasada como parámetro. === compara el valor y el tipo de dato.
  }

  alternarPlataforma(plataforma: Plataforma): void { // método para agregar o quitar una plataforma del videojuego usando operador ternario: condition ? true : false
    this.videojuego.plataformas = this.tienePlataforma(plataforma) // si el videojuego ya tiene la plataforma, la quita; si no, la agrega
      ? this.videojuego.plataformas.filter(p => p.id !== plataforma.id) // filter() devuelve un nuevo array con los elementos que cumplen la condición. Compara los ids de las plataformas del videojuego con el id de la plataforma pasada como parámetro.
      : [...this.videojuego.plataformas, plataforma]; // ... es el operador spread que copia los elementos del array y agrega la nueva plataforma al final.
  }


  guardar(): void { // método al apretar el botón de Guardar
    if (!this.videojuego.fecha_lanzamiento) {
      this.videojuego.fecha_lanzamiento = null; // enviamos null a Django si no se selecciona ninguna fecha, para que no rompa la validación del modelo
    }
    this.videojuegoService.create(this.videojuego).subscribe({ // llamamos al método create del servicio VideojuegoService y .subscribe para manejar la respuesta
      next: () => {
        this.router.navigate(['/videojuegos']);// función flecha (especie de Lambda) que redirige a la lista de videojuegos si se guarda correctamente. El () indica que no recibe parámetros.
        this.toastr.success('Videojuego creado correctamente.'); // muestra un mensaje de éxito con ToastrService
      }, 
      error: () => this.toastr.error('No se pudo guardar. Revisá los datos.')
    });
  }
}