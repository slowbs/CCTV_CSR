import { Component } from '@angular/core';
import { AppURL } from '../../app.url';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  Url = AppURL;
}
