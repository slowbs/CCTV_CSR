import { Component, OnInit } from '@angular/core';
// declare const App: any

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';

  ngOnInit(): void {
    // App.initialLoadPage();
  }
}
