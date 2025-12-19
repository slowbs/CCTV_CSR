import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CctvService, ICctvs, IFloor, IStatus } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
declare const $: any;

@Component({
  selector: 'app-cctv',
  templateUrl: './cctv.component.html',
  styleUrls: ['./cctv.component.css']
})
export class CctvComponent implements OnInit {

  public cctvItems: ICctvs[] = [];
  public allItems: ICctvs[] = []; // Store original data for filtering
  public model: ICctvs;
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];
  private cctvType: string | undefined; // ตัวแปรเก็บประเภทของครุภัณฑ์
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';

  searchText: string = '';

  constructor(private CctvSerivce: CctvService, private route: ActivatedRoute) {
    this.model = this.CctvSerivce.updateModel;
  }

  ngOnInit() {

    this.isLoading = true; //แสดง Loading
    // ดึงค่าพารามิเตอร์จาก URL
    this.route.paramMap.subscribe(params => {
      this.cctvType = params.get('type') || undefined; // เก็บค่าประเภทของครุภัณฑ์
      const titles: { [key: string]: string } = {
        '1': 'กล้องโทรทัศน์วงจรปิด',
        '2': 'เครื่องคอมพิวเตอร์แม่ข่าย',
        '3': 'อุปกรณ์กระจายสัญญาณ',
        '4': 'อุปกรณ์จัดเก็บข้อมูล'
      };
      if (this.cctvType) {
        this.get_Cctv(this.cctvType); // เรียกใช้ get_Cctv พร้อมพารามิเตอร์
        this.searchText = '';
        this.Title = titles[this.cctvType] || 'รายงานข้อมูล';
      }
    });
    this.getStatus(); //ดึงค่าสถานะมาแสดง
    this.getFloor(); //ดึงค่าชั้นมาแสดง
  }

  get_Cctv(type?: string) {
    this.CctvSerivce.get_cctv(type) // ส่ง type ไปยัง service
      .subscribe(result => {
        if (result && result['result']) { // ตรวจสอบว่า result มีข้อมูล
          this.allItems = result['result'];
          this.cctvItems = this.allItems; // Init display items
          this.isLoading = false;
        } else {
          this.cctvItems = []; // หากไม่มีผลลัพธ์ให้กำหนดให้เป็นอาร์เรย์ว่าง
          this.allItems = [];
        }
      });
  }

  getStatus() {
    return this.CctvSerivce.get_status()
      .subscribe(result => {
        this.statusItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
        // Default select all statuses
        this.selectedStatusIds = this.statusItems.map(s => s.status_id!).filter(id => id);
      });
  }

  getFloor() {
    return this.CctvSerivce.get_floor()
      .subscribe(result => {
        this.floorItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
      });
  }

  onSubmit() {
    console.log(this.model)
    this.CctvSerivce.put_cctv(this.model.id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editCctvModal').modal('hide');
          this.get_Cctv(this.cctvType); // เรียก get_Cctv ใหม่หลังการบันทึก
        },
        error: (excep) => {
          console.log(excep);
        }
      });
  }

  onEditModal(items: ICctvs) {
    Object.assign(this.CctvSerivce.updateModel, items);
  }

  selectedStatusIds: string[] = ['1', '2', '3', '4']; // Default show all (ids from DB usually 1-4)

  onSearchItem() {
    let tempItems = this.allItems;

    // 1. Filter by Status
    if (this.statusItems.length > 0 && this.selectedStatusIds.length > 0) {
      tempItems = tempItems.filter(item => {
        // Handle Maintenance Mode (usually overrides status?) 
        // If user wants to filter specifically for MA, we might need a separate checkbox.
        // For now, let's filter by status_id.
        return item.status_id && this.selectedStatusIds.includes(item.status_id);
      });
    }

    // 2. Filter by Text
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      tempItems = tempItems.filter(item => {
        return (item.durable_no && item.durable_no.toLowerCase().includes(term)) ||
          (item.durable_name && item.durable_name.toLowerCase().includes(term)) ||
          (item.brand && item.brand.toLowerCase().includes(term)) ||
          (item.model && item.model.toLowerCase().includes(term)) ||
          (item.location && item.location.toLowerCase().includes(term)) ||
          (item.floor && item.floor.toLowerCase().includes(term)) ||
          (item.ip && item.ip.toLowerCase().includes(term));
      });
    }

    this.cctvItems = tempItems;
  }

  onStatusChange(statusId: string, isChecked: boolean) {
    if (isChecked) {
      if (!this.selectedStatusIds.includes(statusId)) {
        this.selectedStatusIds.push(statusId);
      }
    } else {
      this.selectedStatusIds = this.selectedStatusIds.filter(id => id !== statusId);
    }
    this.onSearchItem();
  }

  onResetSearch() {
    this.searchText = '';
    // Reset status to all available from statusItems if loaded, or keep current?
    // User expectation for "Reset" usually implies resetting filters too.
    if (this.statusItems.length > 0) {
      this.selectedStatusIds = this.statusItems.map(s => s.status_id!);
    } else {
      this.selectedStatusIds = ['1', '2', '3', '4'];
    }
    this.cctvItems = this.allItems;
  }
}
