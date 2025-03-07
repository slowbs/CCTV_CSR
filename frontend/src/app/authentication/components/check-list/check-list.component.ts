import { Component, OnInit } from '@angular/core';
import { CctvService } from '../../../shareds/cctv.service';


@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrl: './check-list.component.css'
})
export class CheckListComponent implements OnInit {
  selectedMonth: string = '';
  checkListItems: any[] = [];

  constructor(private cctvService: CctvService) { }

  ngOnInit(): void {
    this.selectedMonth = this.getLastMonth();
    this.loadChecklist();
  }

  getLastMonth(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  loadChecklist() {
    this.cctvService.getChecklistItems().subscribe((data) => {
      this.checkListItems = data;
      this.loadChecklistLog();
    });
  }

  loadChecklistLog() {
    this.cctvService.getChecklistLogs(this.selectedMonth).subscribe((data) => {
      if (data.length > 0) {
        for (let i = 0; i < this.checkListItems.length; i++) {
          const item = this.checkListItems[i];
          const dbItem = data.find((x: any) => x.checklist_item_id == item.id);
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
    });
  }

  save() {
    const data = {
      month: this.selectedMonth,
      checkList: this.checkListItems.map((item) => {
        return {
          checklist_item_id: item.id,
          status: item.status,
          comment: item.comment
        }
      })
    };
    this.cctvService.saveChecklistLogs(data).subscribe((result) => {
      console.log(result);
    });
  }
}
