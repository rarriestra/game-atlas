import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlataformaList } from './plataforma-list';

describe('PlataformaList', () => {
  let component: PlataformaList;
  let fixture: ComponentFixture<PlataformaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlataformaList],
    }).compileComponents();

    fixture = TestBed.createComponent(PlataformaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
