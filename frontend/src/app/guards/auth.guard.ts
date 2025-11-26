import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CctvService } from '../shareds/cctv.service';
import { AppURL } from '../app.url';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private cctvService: CctvService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.cctvService.get_profile().pipe(
      map(response => {
        if (response && response.session) {
          return true;
        }
        return this.router.createUrlTree(['/', AppURL.Login]);
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/', AppURL.Login]));
      })
    );
  }
}
