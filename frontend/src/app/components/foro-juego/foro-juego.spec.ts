import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForoJuego } from './foro-juego';

describe('ForoJuego', () => {
  let component: ForoJuego;
  let fixture: ComponentFixture<ForoJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForoJuego],
    }).compileComponents();

    fixture = TestBed.createComponent(ForoJuego);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
