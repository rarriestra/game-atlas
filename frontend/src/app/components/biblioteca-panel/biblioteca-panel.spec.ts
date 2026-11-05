import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibliotecaPanel } from './biblioteca-panel';

describe('BibliotecaPanel', () => {
  let component: BibliotecaPanel;
  let fixture: ComponentFixture<BibliotecaPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibliotecaPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(BibliotecaPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
