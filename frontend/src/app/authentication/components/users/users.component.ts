import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CctvService, IUsers } from '../../../shareds/cctv.service';
declare const $: any;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public userItems: IUsers[] = [];
  public model: IUsers;
  // สร้างตัวแปรสำหรับ Post
  model2: IUsers = {
    user_name: '',
    name: '',
    password: '',
    c_password: '',
    status: ''
  };
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  public hasError: boolean = false; // เกิดข้อผิดพลาดในการโหลด

  // Toast notification
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  constructor(
    private cctvService: CctvService,
  ) {
    this.model = this.cctvService.updateModelUser;
  }

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
  }

  clearToast() {
    this.toastMessage = '';
  }


  ngOnInit() {
    this.isLoading = true;
    this.hasError = false;
    this.get_users();
  }

  get_users() {
    this.cctvService.get_users()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.userItems = result['result'] || []; // รับผลลัพธ์โดยตรง
          // console.log(this.userItems);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching users:', err);
          this.hasError = true;
          this.isLoading = false;
          this.showToast('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
        }
      });
  }

  onEditModal(items: IUsers) {
    Object.assign(this.cctvService.updateModelUser, items);
    // console.log(items)
  }

  onEditSubmit() {
    // console.log(this.model)
    this.cctvService.put_user(this.model.user_id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editUserModal').modal('hide');
          this.showToast('แก้ไขข้อมูลผู้ใช้งานสำเร็จ', 'success');
          this.get_users(); // เรียก get_users ใหม่หลังการบันทึก
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.showToast(err.error?.message || 'ไม่สามารถแก้ไขข้อมูลผู้ใช้งานได้', 'error');
        }
      });
  }

  onAddSubmit() {
    // console.log(this.model2)
    this.comparePassword(this.model2)
  }

  private comparePassword(item: any) {
    if (item.password === item.c_password) {
      this.cctvService.post_user(this.model2)
        .subscribe({
          next: (result) => {
            console.log(result)
            $('#addUserModal').modal('hide');
            this.showToast('เพิ่มผู้ใช้งานสำเร็จ', 'success');
            this.get_users(); // เรียก get_users ใหม่หลังการบันทึก
            this.resetModel();
          },
          error: (err) => {
            console.error('Error adding user:', err);
            this.showToast(err.error?.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้', 'error');
          }
        })
    }
    else {
      this.showToast('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง', 'warning');
    }
  }

  resetModel() {
    this.model2 = {
      user_name: '',
      name: '',
      password: '',
      c_password: '',
      status: ''
    }
  }

}
