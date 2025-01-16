import { Component, OnInit } from '@angular/core';
import { CctvService, IUsers } from '../../../shareds/cctv.service';
declare const $: any;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

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

  constructor(
    private cctvService: CctvService,
  ) {
    this.model = this.cctvService.updateModelUser;
  }


  ngOnInit() {
    this.isLoading = true;
    this.hasError = false;
    this.get_users();
  }

  get_users() {
    this.cctvService.get_users()
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
          this.get_users(); // เรียก get_users ใหม่หลังการบันทึก
        },
        error: (excep) => {
          console.log(excep);
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
            this.get_users(); // เรียก get_users ใหม่หลังการบันทึก
            this.resetModel();
          },
          error: (excep) => {
            console.log(excep)
            // alert(excep.error.message)
          }
        })
    }
    else
      console.log('Password not Compare')
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
