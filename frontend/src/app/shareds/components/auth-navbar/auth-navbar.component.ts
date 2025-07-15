import { Component } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../../authentication/authentication.url';
import { CctvService, ISession } from '../../cctv.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-navbar',
  templateUrl: './auth-navbar.component.html',
  styleUrl: './auth-navbar.component.css'
})
export class AuthNavbarComponent {

  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  public profileItem: ISession.Session | null = null;
  public notifyItems: any;

  constructor(
    private cctvService: CctvService,
    private router: Router,
  ) {
    this.get_profile();
  }

  ngOnInit() {
  }

  get_profile() {
    return this.cctvService.get_profile()
      .subscribe({
        next: (result) => {
          // console.log(result)
          this.profileItem = result.session;
          this.get_notify();
          // console.log(this.profileItem)
        },
        error: (excep) => {
          console.log(excep)
          // alert(excep.error.message)
          this.router.navigate(['/', this.AppUrl.Login])
        }
      })
  }

  // ออกจากระบบ
  onLogout() {
    // console.log('Logout')
    return this.cctvService.post_logout()
      .subscribe({
        next: (result) => {
          console.log(result)
          this.router.navigate(['/', this.AppUrl.Login])
        },
        error: (excep) => {
          console.log(excep)
        }
      })
  }

  // ดึงค่าตัวเลขจำนวนแจ้งเตือน
  get_notify() {
    this.cctvService.get_notify()
      .subscribe({
        next: (result) => {
          this.notifyItems = result;
          console.log('Notify items:', this.notifyItems); // แสดงผลข้อมูลที่ได้จาก API
        },
        error: (excep) => {
          console.error('Error getting notifications:', excep);
        }
      });
  }
}