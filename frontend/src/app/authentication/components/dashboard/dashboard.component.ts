import { Component, OnInit } from '@angular/core';
import { AppURL } from '../../../app.url'; // แก้ไข path ใหตรงกับที่ตั้งจริงของ AppUrl
import { AuthenticationURL } from '../../authentication.url'; // แก้ไข path ใหตรงกับที่ตั้งจริงของ AppUrl
import { CctvService, ICountPing } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // ประกาศตัวแปรที่ต้องการใช้
  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  public countPingItems: ICountPing[] = [];

  constructor(private CctvSerivce: CctvService) { }

  ngOnInit(): void {
    this.getCountPing();
  }

  getCountPing() {
    return this.CctvSerivce.get_countping()
      .subscribe(result => {
        this.countPingItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
        console.log(this.countPingItems)
      });
  }
}
