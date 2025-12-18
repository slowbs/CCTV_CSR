import { Component } from '@angular/core';
import { AppURL } from '../../app.url';
import { AuthenticationURL } from '../../authentication/authentication.url';
import { CctvService, ILogin } from '../../shareds/cctv.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL

  // ตัวแปรสำหรับแสดง error message
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private cctvService: CctvService,
    private router: Router
  ) { }

  // ตัวแปรสำหรับใช้ Login
  model: ILogin = {
    user_name: '',
    password: '',
    remember: true
  };

  onSubmit() {
    // Reset error message และเริ่ม loading
    this.errorMessage = '';
    this.isLoading = true;

    this.cctvService.post_login(this.model)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.router.navigate(['/', this.AppUrl.Authen, this.AuthUrl.Dashboard])
        },
        error: (excep) => {
          this.isLoading = false;
          // แสดง error message จาก backend หรือ default message
          this.errorMessage = excep.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
          console.error('Login error:', excep);

          // Auto-hide toast หลัง 4 วินาที
          setTimeout(() => {
            this.errorMessage = '';
          }, 4000);
        }
      })
  }

}
