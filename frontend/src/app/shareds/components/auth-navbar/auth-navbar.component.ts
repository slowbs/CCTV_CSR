import { Component } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../../authentication/authentication.url';
import { CctvService } from '../../cctv.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-navbar',
  templateUrl: './auth-navbar.component.html',
  styleUrl: './auth-navbar.component.css'
})
export class AuthNavbarComponent {

  AppUrl = AppURL
  AuthUrl = AuthenticationURL

  constructor(
    private cctvService: CctvService,
    private router: Router
  ) {
    this.get_profile();
  }
  get_profile() {
    return this.cctvService.get_profile()
      .subscribe({
        next: (result) => {
          console.log(result)
        },
        error: (excep) => {
          console.log(excep)
          // alert(excep.error.message)
        }
      })

  }
}