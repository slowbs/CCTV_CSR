import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthSidebarComponent } from './auth-sidebar.component';

describe('AuthSidebarComponent', () => {
  let component: AuthSidebarComponent;
  let fixture: ComponentFixture<AuthSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthSidebarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
