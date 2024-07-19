import { Component } from '@angular/core';
import { CctvService, ICctvs, IFloor, IStatus, IType } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import { Router } from '@angular/router';

@Component({
  selector: 'app-durable-create',
  templateUrl: './durable-create.component.html',
  styleUrl: './durable-create.component.css'
})
export class DurableCreateComponent {

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL

  public model: ICctvs = {
    durable_no: '',
    type: '',
    floor: '',
    status: ''

  }
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];
  public typeItems: IType[] = [];

  constructor(
    private CctvSerivce: CctvService,
    private router: Router
  ) {
    this.getStatus()
    this.getFloor()
    this.getType()
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

  getType() {
    return this.CctvSerivce.get_type()
      .subscribe(result => {
        // console.log(result)
        this.typeItems = result['result']
      })
  }

  onSubmit() {
    // console.log(this.model)
    this.CctvSerivce.post_items(this.model)
      .subscribe({
        next: (result) => {
          console.log(result)
          this.router.navigate(['/', this.AppUrl.Authen, this.AuthUrl.Index])
        },
        error: (excep) => {
          console.log(excep)
        }
      })
  }

}
