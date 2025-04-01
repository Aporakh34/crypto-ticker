import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoTableComponent } from './crypto-table.component';

describe('CryptoTableComponent', () => {
  let component: CryptoTableComponent;
  let fixture: ComponentFixture<CryptoTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CryptoTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
