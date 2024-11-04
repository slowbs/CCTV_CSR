import { Component } from '@angular/core';
import { CctvService, ICctvs, IFloor, IStatus } from '../../../shareds/cctv.service';
declare const $: any;

@Component({
  selector: 'app-cctv',
  templateUrl: './cctv.component.html',
  styleUrls: ['./cctv.component.css']
})

export class CctvComponent {



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
  ]

  constructor(private CctvSerivce: CctvService) {
    this.model = this.CctvSerivce.updateModel;
    this.get_Cctv()
    this.getStatus()
    this.getFloor()
    this.searchType = this.searchTypeItem[0]
  }

  get_Cctv(options?: ICctvsSearch) {
    return this.CctvSerivce.get_cctv()
      .subscribe(result => {
        if (options) {
          // console.log("search")
          this.cctvItems = result['result']
            .filter(result => result[options.searchType].toString().toLowerCase()
              .indexOf(options.searchText.toString().toLowerCase()) >= 0)
        }
        else {
          this.cctvItems = result['result']
        }
        // this.cctvItems = result['result']
        // console.log(result['result'])
        // this.checked = false
      });
  }

  getStatus() {
    return this.CctvSerivce.get_status()
      .subscribe(result => {
        this.statusItems = result['result']
        // console.log(this.statusItems)
      });
  }

  getFloor() {
    return this.CctvSerivce.get_floor()
      .subscribe(result => {
        this.floorItems = result['result']
        // console.log(this.floorItems)
      });
  }


  onSubmit() {
    // console.log(this.model)
    this.CctvSerivce.put_items(this.model.id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result)
          $('#editCctvModal').modal('hide');
          this.get_Cctv()
        },
        error: (excep) => {
          console.log(excep)
          // alert(excep.error.message)
        }
      })
  }

  //Function เมื่อกดปุ่มแก้ไข
  onEditModal(items: ICctvs) {
    Object.assign(this.CctvSerivce.updateModel, items)
    // console.log(this.cctvService.updateModel)
  }

  onSearchItem() {
    // console.log(this.searchText, this.searchType)
    this.get_Cctv({
      searchText: this.searchText,
      searchType: this.searchType.key
    })
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
