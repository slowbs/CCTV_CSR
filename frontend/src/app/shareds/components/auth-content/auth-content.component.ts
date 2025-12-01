import { Component, OnInit } from '@angular/core';
declare const App: any;

@Component({
  selector: 'app-auth-content',
  templateUrl: './auth-content.component.html',
  styleUrl: './auth-content.component.css'
})
export class AuthContentComponent implements OnInit {

  ngOnInit(): void {
    App.initialLoadPage();
  }
}
