import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CctvService, ICctvs, IFloor, IStatus } from '../../../shareds/cctv.service';
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
    // ดึงค่าพารามิเตอร์จาก URL
    this.route.paramMap.subscribe(params => {
      const type = params.get('type'); // ค่าพารามิเตอร์ที่เป็น string | null
      if (type) { // ตรวจสอบว่าค่าไม่เป็น null
        this.get_Cctv(type); // เรียกใช้ get_Cctv พร้อมพารามิเตอร์
      } else {
        this.get_Cctv(); // เรียกใช้ get_Cctv โดยไม่ระบุ type
      }
    });

    this.getStatus();
    this.getFloor();
  }

  get_Cctv(type?: string, options?: ICctvsSearch) {
    this.CctvSerivce.get_cctv(type) // ส่ง type ไปยัง service
      .subscribe(result => {
        if (options) {
          this.cctvItems = result['result']
            .filter(result => result[options.searchType].toString().toLowerCase()
              .indexOf(options.searchText.toString().toLowerCase()) >= 0);
        } else {
          this.cctvItems = result['result'];
        }
      });
  }

  getStatus() {
    return this.CctvSerivce.get_status()
      .subscribe(result => {
        this.statusItems = result['result'];
      });
  }

  getFloor() {
    return this.CctvSerivce.get_floor()
      .subscribe(result => {
        this.floorItems = result['result'];
      });
  }

  onSubmit() {
    this.CctvSerivce.put_items(this.model.id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editCctvModal').modal('hide');
          this.get_Cctv(); // เรียก get_Cctv ใหม่หลังการบันทึก
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
    this.get_Cctv(undefined, {
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
