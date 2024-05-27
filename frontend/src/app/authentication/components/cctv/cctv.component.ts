import { Component } from '@angular/core';
import { CctvService, ICctvs } from '../../../shareds/cctv.service';
declare const $: any;

@Component({
  selector: 'app-cctv',
  templateUrl: './cctv.component.html',
  styleUrl: './cctv.component.css'
})
export class CctvComponent {

  public cctvItems: ICctvs[] = [];
  public model: ICctvs;

  constructor(private CctvSerivce: CctvService) {
    this.model = this.CctvSerivce.updateModel;
    this.get_Cctv()
  }

  get_Cctv() {
    return this.CctvSerivce.get_cctv()
      .subscribe(result => {
        this.cctvItems = result['result']
        // console.log(result['result'])
        // this.checked = false
      });
  }


  onSubmit() {
    console.log(this.model)
  }

    //Function เมื่อกดปุ่มแก้ไข
    onEditModal(items: ICctvs) {
      Object.assign(this.CctvSerivce.updateModel, items)
      // console.log(this.cctvService.updateModel)
    }

}
