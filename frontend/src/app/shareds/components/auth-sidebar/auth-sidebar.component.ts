import { Component } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../../authentication/authentication.url';

@Component({
  selector: 'app-auth-sidebar',
  templateUrl: './auth-sidebar.component.html',
  styleUrl: './auth-sidebar.component.css'
})
export class AuthSidebarComponent {

  AppUrl = AppURL
  AuthUrl = AuthenticationURL

}
