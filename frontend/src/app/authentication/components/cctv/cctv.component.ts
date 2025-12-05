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
  public model: ICctvs;
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];
  private cctvType: string | undefined; // ตัวแปรเก็บประเภทของครุภัณฑ์
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';

  searchText: string = '';
  searchType: ICctvsSearchKey;
  searchTypeItem: ICctvsSearchKey[] = [
    { key: 'durable_no', value: 'เลขครุภัณฑ์' },
    { key: 'durable_name', value: 'ชื่อครุภัณฑ์' },
    { key: 'ip', value: 'หมายเลข IP' }
  ];

  constructor(private CctvSerivce: CctvService, private route: ActivatedRoute) {
    this.model = this.CctvSerivce.updateModel;
    this.searchType = this.searchTypeItem[0];
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
        this.searchType = this.searchTypeItem[0];
        this.Title = titles[this.cctvType] || 'รายงานข้อมูล';
      }
    });
    this.getStatus(); //ดึงค่าสถานะมาแสดง
    this.getFloor(); //ดึงค่าชั้นมาแสดง
  }

  get_Cctv(type?: string, options?: ICctvsSearch) {
    this.CctvSerivce.get_cctv(type) // ส่ง type ไปยัง service
      .subscribe(result => {
        if (result && result['result']) { // ตรวจสอบว่า result มีข้อมูล
          if (options) {
            this.cctvItems = result['result']
              .filter(item => item[options.searchType]?.toString().toLowerCase()
                .includes(options.searchText.toLowerCase()));
            this.isLoading = false;
          } else {
            this.cctvItems = result['result'];
            this.isLoading = false;
          }
        } else {
          this.cctvItems = []; // หากไม่มีผลลัพธ์ให้กำหนดให้เป็นอาร์เรย์ว่าง

        }
      });
  }

  getStatus() {
    return this.CctvSerivce.get_status()
      .subscribe(result => {
        this.statusItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
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

  onSearchItem() {
    this.get_Cctv(this.cctvType, { // ส่ง type ที่เก็บไว้
      searchText: this.searchText,
      searchType: this.searchType.key
    });
  }


}

// ส่วนสำหรับการค้นหา
export interface ICctvsSearchKey {
  key: string;
  value: string;
}

export interface ICctvsSearch {
  searchText: string;
  searchType: string;
}
