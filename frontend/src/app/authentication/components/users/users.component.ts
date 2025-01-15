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

  onSubmit() {
    console.log(this.model)
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

}
