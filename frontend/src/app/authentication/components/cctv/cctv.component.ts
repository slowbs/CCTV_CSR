import { Component } from '@angular/core';
import { CctvService, ICctvs } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-cctv',
  templateUrl: './cctv.component.html',
  styleUrl: './cctv.component.css'
})
export class CctvComponent {

  public cctvItems: ICctvs[] = [];

  constructor(private CctvSerivce: CctvService) {
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

}
