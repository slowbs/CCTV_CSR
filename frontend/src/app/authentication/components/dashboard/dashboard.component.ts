import { Component, OnInit } from '@angular/core';
import { AppURL } from '../../../app.url'; // แก้ไข path ใหตรงกับที่ตั้งจริงของ AppUrl
import { AuthenticationURL } from '../../authentication.url'; // แก้ไข path ใหตรงกับที่ตั้งจริงของ AppUrl

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // ประกาศตัวแปรที่ต้องการใช้
  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;

  constructor() {}

  ngOnInit(): void {
    // สามารถเรียกใช้ฟังก์ชันหรือข้อมูลอื่น ๆ ได้ที่นี่
  }
}
