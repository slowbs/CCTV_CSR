import { Component } from '@angular/core';
import { AppURL } from '../../app.url';
import { CctvService, IUsers } from '../../cctv.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  Url = AppURL;

  constructor(
    private cctvService: CctvService,
    private router: Router
  ) { }


  // สร้างตัวแปรสำหรับ Post
  model: IUsers = {
    user_name: '',
    name: '',
    password: '',
    c_password: ''
  };

  onSubmit() {
    console.log(this.model)
  }
}
