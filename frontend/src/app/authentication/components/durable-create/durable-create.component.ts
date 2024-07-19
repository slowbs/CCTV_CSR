import { Component } from '@angular/core';
import { CctvService, ICctvs, IFloor, IStatus } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-durable-create',
  templateUrl: './durable-create.component.html',
  styleUrl: './durable-create.component.css'
})
export class DurableCreateComponent {

  public model: ICctvs = {
    durable_no: '',
    floor: '',
    status: ''

  }
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];

  constructor(private CctvSerivce: CctvService) {
    this.getStatus()
    this.getFloor()
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
    this.CctvSerivce.post_items(this.model)
      .subscribe({
        next: (result) => {
          console.log(result)
        },
        error: (excep) => {
          console.log(excep)
        }
      })
  }

}
