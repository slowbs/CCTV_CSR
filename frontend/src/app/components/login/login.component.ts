import { Component } from '@angular/core';
import { AppURL } from '../../app.url';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  Url = AppURL;
}
