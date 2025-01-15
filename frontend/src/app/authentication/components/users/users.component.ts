import { Component, OnInit } from '@angular/core';
import { CctvService, IUsers } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  public userItems: IUsers[] = [];
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  public hasError: boolean = false; // เกิดข้อผิดพลาดในการโหลด

  constructor(
    private cctvService: CctvService,
  ) { }

  // ngOnInit() {
  //   return this.cctvService.get_users()
  //     .subscribe(result => {
  //       this.userItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
  //       console.log(this.userItems)
  //     });
  // }

  ngOnInit() {
    this.isLoading = true;
    this.hasError = false;
    this.cctvService.get_users()
      .subscribe({
        next: (result) => {
          this.userItems = result['result'] || []; // รับผลลัพธ์โดยตรง
          console.log(this.userItems);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching users:', err);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

}
