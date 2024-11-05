import { Component, OnInit } from '@angular/core';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import { CctvService, ICountPing, ILogPing } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  public countPingItems: ICountPing[] = [];
  public recentStatusChanges: ILogPing[] = []; // ตัวแปรใหม่สำหรับเก็บข้อมูลการเปลี่ยนแปลงสถานะ

  constructor(private CctvSerivce: CctvService) { }

  ngOnInit(): void {
    this.getCountPing();
    this.getRecentStatusChanges(); // เรียกใช้ฟังก์ชันใหม่
  }

  getCountPing() {
    return this.CctvSerivce.get_countping()
      .subscribe(result => {
        this.countPingItems = result['counts'] || [];
      });
  }

  getRecentStatusChanges() {
    return this.CctvSerivce.getRecentStatusChanges()
      .subscribe(result => {
        this.recentStatusChanges = result['logs'] || []; // เก็บข้อมูลสถานะล่าสุด
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
