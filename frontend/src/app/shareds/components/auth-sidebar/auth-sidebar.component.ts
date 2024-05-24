import { Component, Input, OnInit } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../../authentication/authentication.url';
import { AuthNavbarComponent } from '../auth-navbar/auth-navbar.component';
import { ISession } from '../../cctv.service';

@Component({
  selector: 'app-auth-sidebar',
  templateUrl: './auth-sidebar.component.html',
  styleUrl: './auth-sidebar.component.css'
})
export class AuthSidebarComponent implements OnInit{

  @Input('AuthNavbarComp') AuthNavbarComp: AuthNavbarComponent

  // public profileItem: ISession.Session

  AppUrl = AppURL
  AuthUrl = AuthenticationURL

  ngOnInit(): void {
    this.AuthNavbarComp.get_profile()
  }

}
