import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import { CctvService, ICountPing, ILogPing } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  public countPingItems: ICountPing[] = [];
  public recentStatusChanges: ILogPing[] = []; // ตัวแปรใหม่สำหรับเก็บข้อมูลการเปลี่ยนแปลงสถานะ
  public isLoading: boolean = true; // กำลังโหลดข้อมูล

  // Toast notification
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  constructor(private CctvSerivce: CctvService) { }

  ngOnInit(): void {
    this.isLoading = true; //แสดง Loading
    this.getCountPing();
    this.getRecentStatusChanges(); // เรียกใช้ฟังก์ชันใหม่
  }

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
  }

  clearToast() {
    this.toastMessage = '';
  }

  getCountPing() {
    return this.CctvSerivce.get_countping()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.countPingItems = result['counts'] || [];
        },
        error: (err) => {
          console.error('Error loading count ping:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลสรุปสถานะได้', 'error');
        }
      });
  }

  getRecentStatusChanges() {
    return this.CctvSerivce.getRecentStatusChanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.recentStatusChanges = result['logs'] || []; // เก็บข้อมูลสถานะล่าสุด
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading recent status changes:', err);
          this.isLoading = false;
          this.showToast('ไม่สามารถโหลดข้อมูลการเปลี่ยนแปลงสถานะได้', 'error');
        }
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
