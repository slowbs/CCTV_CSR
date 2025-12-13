import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CctvMapManagerComponent } from './cctv-map-manager.component';

describe('CctvMapManagerComponent', () => {
  let component: CctvMapManagerComponent;
  let fixture: ComponentFixture<CctvMapManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CctvMapManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CctvMapManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
