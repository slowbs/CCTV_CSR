import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CctvService, ILogPing } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { AuthenticationURL } from '../../authentication.url';
declare const $: any;

@Component({
  selector: 'app-log-ping',
  templateUrl: './log-ping.component.html',
  styleUrls: ['./log-ping.component.css'] // แก้ไขเป็น styleUrls (มีตัว 's')
})
export class LogPingComponent implements OnInit {

  public allLogpingItems: ILogPing[] = []; // สำหรับเก็บข้อมูลทั้งหมดจาก Server
  public logpingItems: ILogPing[] = []; // สำหรับเก็บข้อมูลที่แสดงในหน้าปัจจุบัน
  public model: ILogPing;
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';

  // --- Pagination Properties ---
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 20; // จำนวนรายการต่อหน้า
  maxSize: number = 5; // จำนวนหมายเลขหน้าที่แสดง
  // -----------------------------

  private currentTypeId: string | null = null;

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute
  ) {
    this.model = this.cctvService.updateModelLogping;
  }

  ngOnInit() {
    const titles: { [key: string]: string } = {
      '1': 'กล้องโทรทัศน์วงจรปิด',
      '2': 'เครื่องคอมพิวเตอร์แม่ข่าย',
      '3': 'อุปกรณ์กระจายสัญญาณ',
      '4': 'อุปกรณ์จัดเก็บข้อมูล'
    };


    this.isLoading = true; //แสดง Loading
    // ดึงค่าพารามิเตอร์ id จาก route และใช้เรียกข้อมูล log ping
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.currentTypeId = id;
      if (id) {
        this.get_LogPing(id);
        this.Title = titles[id] || 'รายงานข้อมูล';
      }
    });
  }
  
  get_LogPing(id: string) {
    this.isLoading = true;
    this.cctvService.get_logping(id)
      .subscribe(result => {
        this.allLogpingItems = result['result'];
        this.totalItems = this.allLogpingItems.length;
        this.currentPage = 1; // กลับไปหน้าแรกเสมอเมื่อโหลดข้อมูลใหม่
        this.updatePaginatedItems(); // แสดงผลข้อมูลหน้าแรก
        this.isLoading = false;
      });
  }

  // --- Pagination Methods ---
  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.updatePaginatedItems();
  }

  private updatePaginatedItems(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.logpingItems = this.allLogpingItems.slice(startIndex, endIndex);
  }
  // --------------------------

  onEditModal(items: ILogPing) {
    Object.assign(this.cctvService.updateModelLogping, items);
    // console.log(items)
  }

  onEditSubmit() {
    // console.log(this.model)
    this.cctvService.put_logping(this.model.log_id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editCommentModal').modal('hide');
          // โหลดข้อมูลใหม่หลังจากแก้ไข
          if (this.currentTypeId) this.get_LogPing(this.currentTypeId);
        },
        error: (excep) => {
          console.log(excep);
        }
      });
  }


}
