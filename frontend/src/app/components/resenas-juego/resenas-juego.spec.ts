import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResenasJuego } from './resenas-juego';

describe('ResenasJuego', () => {
  let component: ResenasJuego;
  let fixture: ComponentFixture<ResenasJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResenasJuego],
    }).compileComponents();

    fixture = TestBed.createComponent(ResenasJuego);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
