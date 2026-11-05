import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibliotecaList } from './biblioteca-list';

describe('BibliotecaList', () => {
  let component: BibliotecaList;
  let fixture: ComponentFixture<BibliotecaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibliotecaList],
    }).compileComponents();

    fixture = TestBed.createComponent(BibliotecaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
