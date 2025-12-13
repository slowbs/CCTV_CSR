import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorCctvComponent } from './monitor-cctv.component';

describe('MonitorCctvComponent', () => {
  let component: MonitorCctvComponent;
  let fixture: ComponentFixture<MonitorCctvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonitorCctvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MonitorCctvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
