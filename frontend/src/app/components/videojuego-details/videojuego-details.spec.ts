import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideojuegoDetails } from './videojuego-details';

describe('VideojuegoDetails', () => {
  let component: VideojuegoDetails;
  let fixture: ComponentFixture<VideojuegoDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideojuegoDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(VideojuegoDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
