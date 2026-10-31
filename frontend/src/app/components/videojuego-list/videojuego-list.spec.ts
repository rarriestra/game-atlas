import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideojuegoList } from './videojuego-list';

describe('VideojuegoList', () => {
  let component: VideojuegoList;
  let fixture: ComponentFixture<VideojuegoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideojuegoList],
    }).compileComponents();

    fixture = TestBed.createComponent(VideojuegoList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
