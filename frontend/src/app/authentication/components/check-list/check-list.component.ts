import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrl: './check-list.component.css'
})
export class CheckListComponent implements OnInit {
  selectedMonth: string = '';
  checkListItems: any[] = [];
  checkListItemsBackup: any[] = [
    { id: 1, task: 'Back up Server A', schedule: 'ทุกวันจันทร์', status: 'ปกติ', comment: '' },
    { id: 2, task: 'Snapshot VM B', schedule: 'ทุกวัน', status: 'ปกติ', comment: '' },
    { id: 3, task: 'สำรองข้อมูล Database X', schedule: 'ทุกวัน', status: 'ปกติ', comment: '' },
    { id: 4, task: 'ทดสอบการ Restore Server A', schedule: 'ทุกต้นเดือน', status: 'ปกติ', comment: '' },
    { id: 5, task: 'ตรวจสอบ Snapshot บน Hypervisor', schedule: 'ทุกวันที่ 15', status: 'ปกติ', comment: '' }
  ];
  checkListLogBackup: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.selectedMonth = this.getLastMonth();
    this.loadChecklist();
  }

  getLastMonth(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // เดือนย้อนหลัง 1 เดือน
    const year = lastMonth.getFullYear();
    const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  loadChecklist() {
    //จำลองการดึงข้อมูลรายการ check-list
    this.checkListItems = this.checkListItemsBackup.map(item => ({ ...item })); // Clone the array
    this.loadChecklistLog();
  }

  loadChecklistLog() {
    //จำลองการดึงข้อมูล checklist ของเดือนนี้
    const currentLog = this.checkListLogBackup.find((x: any) => x.month === this.selectedMonth);
    if (currentLog) {
      for (let i = 0; i < this.checkListItems.length; i++) {
        const item = this.checkListItems[i];
        const dbItem = currentLog.checkList.find((x: any) => x.checklist_item_id == item.id);
        if (dbItem) {
          item.status = dbItem.status;
          item.comment = dbItem.comment;
        } else {
          item.status = 'ปกติ';
          item.comment = '';
        }
      }
    } else {
      for (let i = 0; i < this.checkListItems.length; i++) {
        this.checkListItems[i].status = 'ปกติ';
        this.checkListItems[i].comment = '';
      }
    }
  }

  save() {
    //จำลองการบันทึก
    const currentLogIndex = this.checkListLogBackup.findIndex((x: any) => x.month === this.selectedMonth);
    const currentLog = {
      month: this.selectedMonth,
      checkList: this.checkListItems.map((item) => {
        return {
          checklist_item_id: item.id,
          status: item.status,
          comment: item.comment
        }
      })
    };
    if (currentLogIndex !== -1) {
      // Update the existing month's data
      this.checkListLogBackup[currentLogIndex] = currentLog;
    } else {
      // Push the new month's data
      this.checkListLogBackup.push(currentLog);
    }
    const log = this.checkListLogBackup.find((x: any) => x.month == this.selectedMonth);
    console.log(log);
  }
}
