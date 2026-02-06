import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL

  public model: ICctvs = {
    durable_no: '',
    type: '',
    floor: '',
    status: '',
    ip: '' // กำหนดค่าเริ่มต้นเป็น ''
  }
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];
  public typeItems: IType[] = [];

  // Toast notification
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
  }

  clearToast() {
    this.toastMessage = '';
  }

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.statusItems = result['result'] || [];
        },
        error: (err) => {
          console.error('Error loading status:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลสถานะได้', 'warning');
        }
      });
  }

  getFloor() {
    return this.CctvSerivce.get_floor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.floorItems = result['result'] || [];
        },
        error: (err) => {
          console.error('Error loading floor:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลชั้นได้', 'warning');
        }
      });
  }

  getType() {
    return this.CctvSerivce.get_type()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.typeItems = result['result'] || [];
        },
        error: (err) => {
          console.error('Error loading type:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลประเภทได้', 'warning');
        }
      });
  }

  onSubmit() {
    // console.log(this.model)
    if (!this.model.ip) {
      this.model.ip = "";
    }
    this.CctvSerivce.post_items(this.model)
      .subscribe({
        next: (result) => {
          console.log(result)
          this.showToast('เพิ่มครุภัณฑ์สำเร็จ', 'success');
          this.router.navigate(['/', this.AppUrl.Authen, this.AuthUrl.Index])
        },
        error: (err) => {
          console.error('Error adding item:', err);
          this.showToast(err.error?.message || 'ไม่สามารถเพิ่มครุภัณฑ์ได้', 'error');
        }
      })
  }

}
