import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideojuegoAdd } from './videojuego-add';

describe('VideojuegoAdd', () => {
  let component: VideojuegoAdd;
  let fixture: ComponentFixture<VideojuegoAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideojuegoAdd],
    }).compileComponents();

    fixture = TestBed.createComponent(VideojuegoAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
