import { Component, OnInit, Input } from '@angular/core';
declare const App: any;

@Component({
  selector: 'app-auth-content',
  templateUrl: './auth-content.component.html',
  styleUrl: './auth-content.component.css'
})
export class AuthContentComponent implements OnInit {

  @Input() isFullScreen: boolean = false;

  ngOnInit(): void {
    App.initialLoadPage();
  }
}
