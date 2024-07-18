import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DurableCreateComponent } from './durable-create.component';

describe('DurableCreateComponent', () => {
  let component: DurableCreateComponent;
  let fixture: ComponentFixture<DurableCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DurableCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DurableCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
