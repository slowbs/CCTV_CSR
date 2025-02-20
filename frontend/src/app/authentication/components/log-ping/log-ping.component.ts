import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CctvService, ILogPing } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
declare const $: any;

@Component({
  selector: 'app-log-ping',
  templateUrl: './log-ping.component.html',
  styleUrls: ['./log-ping.component.css'] // แก้ไขเป็น styleUrls (มีตัว 's')
})
export class LogPingComponent implements OnInit {

  public logpingItems: ILogPing[] = [];
  public model: ILogPing;
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute
  ) {
    this.model = this.cctvService.updateModelLogping;
  }

  ngOnInit() {
    const titles: { [key: string]: string } = {
      '1': 'กล้องโทรทัศน์วงจรปิด',
      '2': 'เครื่องคอมพิวเตอร์แม่ข่าย',
      '3': 'อุปกรณ์กระจายสัญญาณ',
      '4': 'อุปกรณ์จัดเก็บข้อมูล'
    };


    this.isLoading = true; //แสดง Loading
    // ดึงค่าพารามิเตอร์ id จาก route และใช้เรียกข้อมูล log ping
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.get_LogPing(id);
        this.Title = titles[id] || 'รายงานข้อมูล';
      }
    });
  }

  get_LogPing(id: string) {
    this.cctvService.get_logping(id)
      .subscribe(result => {
        this.logpingItems = result['result'];
        // console.log(this.logpingItems);
        this.isLoading = false;
      });
  }

  onEditModal(items: ILogPing) {
    Object.assign(this.cctvService.updateModelLogping, items);
    // console.log(items)
  }

  onEditSubmit() {
    // console.log(this.model)
    this.cctvService.put_logping(this.model.log_id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editCommentModal').modal('hide');
          this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
              this.get_LogPing(id);
            }
          });
        },
        error: (excep) => {
          console.log(excep);
        }
      });
  }


}
