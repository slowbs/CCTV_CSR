import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogPingComponent } from './log-ping.component';

describe('LogPingComponent', () => {
  let component: LogPingComponent;
  let fixture: ComponentFixture<LogPingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogPingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogPingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
