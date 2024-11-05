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
      });
  }

  getTypeName(type: string): string {
    switch (type) {
      case '1': return 'กล้องโทรทัศน์วงจรปิด';
      case '2': return 'เครื่องคอมพิวเตอร์แม่ข่าย';
      case '3': return 'อุปกรณ์กระจายสัญญาณ';
      case '4': return 'อุปกรณ์จัดเก็บข้อมูล';
      default: return 'ไม่ทราบประเภท';
    }
  }

}
