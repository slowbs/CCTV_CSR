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

  onSubmit(){
    console.log(this.model)
    this.router.navigate(['/', this.AppUrl.Authen, this.AuthUrl.Dashboard])
  }

}
