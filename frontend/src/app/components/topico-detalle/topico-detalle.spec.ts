import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicoDetalleComponent } from './topico-detalle';

describe('TopicoDetalleComponent', () => {
  let component: TopicoDetalleComponent;
  let fixture: ComponentFixture<TopicoDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicoDetalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicoDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
