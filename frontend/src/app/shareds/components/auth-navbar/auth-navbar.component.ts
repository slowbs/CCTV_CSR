import { Component, OnInit } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../../authentication/authentication.url';
import { CctvService, ISession } from '../../cctv.service';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-auth-navbar',
  templateUrl: './auth-navbar.component.html',
  styleUrl: './auth-navbar.component.css'
})
export class AuthNavbarComponent implements OnInit {

  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  public profileItem: ISession.Session | null = null;
  public notifyItems: any;

  constructor(
    private cctvService: CctvService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.get_profile();
  }

  get_profile() {
    this.cctvService.get_profile().pipe(
      tap(profileResult => {
        // ใช้ tap เพื่อกำหนดค่า profile โดยไม่กระทบ stream หลัก
        this.profileItem = profileResult.session;
      }),
      // หลังจากได้ profile แล้ว ให้ "สลับ" ไปทำงานที่ stream ของ get_notify
      switchMap(() => this.cctvService.get_notify())
    ).subscribe({
      next: (notifyResult) => {
        // ผลลัพธ์ที่ได้ใน next นี้ คือผลลัพธ์จาก get_notify()
        this.notifyItems = notifyResult["result"][0];
        console.log('Final Notify Result:', this.notifyItems);
      },
      error: (err) => {
        // error handler นี้จะดักจับ error จากทั้ง get_profile และ get_notify
        console.error('An error occurred in the data loading chain:', err);
        this.router.navigate(['/', this.AppUrl.Login]);
      }
    });
  }

  // ออกจากระบบ
  onLogout() {
    this.cctvService.post_logout()
      .subscribe({
        next: () => this.router.navigate(['/', this.AppUrl.Login]),
        error: (excep) => console.error('Logout failed:', excep)
      });
  }
}