import { Component, OnInit } from '@angular/core';
import { CctvService } from '../../../shareds/cctv.service';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';
import { DatePipe } from '@angular/common';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

pdfMake.addFonts({
  Sarabun: {
    normal: 'Sarabun-Regular.ttf',
    bold: 'Sarabun-Bold.ttf',
  },
});

@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrl: './check-list.component.css'
})
export class CheckListComponent implements OnInit {
  selectedMonth: string = '';
  checkListItems: any[] = [];

  constructor(private cctvService: CctvService, private datePipe: DatePipe) { }

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

  //generate pdf
  generatePDF(): void {
    const documentDefinition = {
      defaultStyle: {
        font: 'Sarabun',
        fontSize: 8
      },
      content: [
        { text: 'รายงานการตรวจสอบระบบสำรองข้อมูล', style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        {
          text: `ข้อมูลสำหรับเดือน : ${this.formatDateForDisplay(this.selectedMonth)}`,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        this.getTableContent()
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fillColor: '#2980b9',
          color: 'white'
        }
      }
    };

    pdfMake.createPdf(documentDefinition).download('checklist.pdf');
  }

  //สร้างเนื้อหาตาราง
  getTableContent() {
    const body: any[][] = [];

    // สร้าง header row
    body.push([
      { text: 'ลำดับที่', style: 'tableHeader', alignment: 'center' },
      { text: 'รายการตรวจสอบ', style: 'tableHeader', alignment: 'center' },
      { text: 'กำหนดเวลา', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานะ', style: 'tableHeader', alignment: 'center' },
      { text: 'หมายเหตุ', style: 'tableHeader', alignment: 'center' }
    ]);

    // วนลูปข้อมูล
    this.checkListItems.forEach((item, index) => {
      body.push([
        { text: (index + 1).toString(), alignment: 'center' },
        { text: item.task },
        { text: item.schedule },
        { text: item.status, alignment: 'center' },
        { text: item.comment || '' }
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto', '*'],
        body: body
      }
    };
  }

  formatDateForDisplay(input: string): string {
    // input format yyyy-MM
    if (!input) return ""
    const [year, month] = input.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const transformedDate = this.datePipe.transform(date, 'MMMM yyyy', 'th-TH')
    if (transformedDate) {
      const yearInBuddhistEra = date.getFullYear() + 543;
      return transformedDate.replace(date.getFullYear().toString(), yearInBuddhistEra.toString());
    }
    return "";
  }
}
