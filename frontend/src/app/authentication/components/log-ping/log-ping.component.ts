import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CctvService, ILogPing } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-log-ping',
  templateUrl: './log-ping.component.html',
  styleUrls: ['./log-ping.component.css'] // แก้ไขเป็น styleUrls (มีตัว 's')
})
export class LogPingComponent implements OnInit {

  public logpingItems: ILogPing[] = [];
  public isLoading: boolean = true; // กำลังโหลดข้อมูล

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    this.isLoading = true; //แสดง Loading
    // ดึงค่าพารามิเตอร์ id จาก route และใช้เรียกข้อมูล log ping
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.get_LogPing(id);
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
}
