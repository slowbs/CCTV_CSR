import { Component } from '@angular/core';
import { AppURL } from '../../app.url';

import { Router } from '@angular/router';
import { CctvService, IUsers } from '../../shareds/cctv.service';
import { AuthenticationURL } from '../../authentication/authentication.url';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL

  constructor(
    private cctvService: CctvService,
    private router: Router
  ) { }


  // สร้างตัวแปรสำหรับ Post
  model: IUsers = {
    user_name: '',
    name: '',
    password: '',
    c_password: '',
  };

  onSubmit() {
    this.comparePassword(this.model)
  }

  private comparePassword(item: any) {
    if (item.password === item.c_password) {
      this.cctvService.post_user(this.model)
        .subscribe({
          next: (result) => {
            console.log(result)
            // this.router.navigate(['/', this.AppUrl.Authen, this.AuthUrl.Dashboard])
            this.router.navigate(['/', this.AppUrl.Login])
          },
          error: (excep) => {
            console.log(excep)
            // alert(excep.error.message)
          }
        })
    }
    else
      console.log('Password not Compare')
  }
}
