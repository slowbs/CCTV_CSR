import { Component, OnInit } from '@angular/core';
import { CctvService } from '../../../shareds/cctv.service';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';
import { DatePipe } from '@angular/common';
import { BsLocaleService, BsDatepickerConfig, BsDatepickerViewMode } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { thLocale } from 'ngx-bootstrap/locale';

defineLocale('th', thLocale);

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
  selectedMonth: Date | null = null;
  checkListItems: any[] = [];
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    private cctvService: CctvService,
    private datePipe: DatePipe,
    private localeService: BsLocaleService
  ) {
    this.localeService.use('th');
    //กำหนดค่าเริ่มต้นให้ datepicker
    this.bsConfig = Object.assign({}, {
      minMode: 'month' as BsDatepickerViewMode, //กำหนดให้เลือกได้เฉพาะเดือน
      isAnimated: true, // กำหนด animation
      showClearButton: true, //แสดงปุ่ม clear
      dateInputFormat: 'MM/YYYY' //กำหนด format ให้แสดงเป็น MM/YYYY
    });
  }

  ngOnInit(): void {
    //กำหนดค่าเริ่มต้นให้ selectedMonth เป็นเดือนที่แล้ว
    this.selectedMonth = this.getLastMonth();
    this.loadChecklist();
  }

  getLastMonth(): Date {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lastMonth;
  }

  loadChecklist() {
    this.cctvService.getChecklistItems().subscribe((data) => {
      this.checkListItems = data;
      this.loadChecklistLog();
    });
  }

  loadChecklistLog() {
    // แปลงวันที่เป็น string ในรูปแบบที่ API ต้องการ (เช่น 'yyyy-MM')
    let selectedMonthString: string = ""
    if (this.selectedMonth) {
      selectedMonthString = this.datePipe.transform(this.selectedMonth, 'yyyy-MM') || "";
    }

    this.cctvService.getChecklistLogs(selectedMonthString).subscribe((data) => {
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
    // แปลงวันที่เป็น string ในรูปแบบที่ API ต้องการ (เช่น 'yyyy-MM')
    let selectedMonthString: string = ""
    if (this.selectedMonth) {
      selectedMonthString = this.datePipe.transform(this.selectedMonth, 'yyyy-MM') || "";
    }

    const data = {
      month: selectedMonthString,
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
        { text: 'รายงานการตรวจสอบระบบสำรองข้อมูล (Back Up)', style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        {
          text: `ข้อมูลสำหรับเดือน : ${this.formatDateForDisplayForPdf(this.selectedMonth)}`, // แก้ไขตรงนี้
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
      { text: 'ที่', style: 'tableHeader', alignment: 'center' },
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
        widths: ['auto', 150, 150, 'auto', '*'],
        body: body
      }
    };
  }

  formatDateForDisplay(date: Date | null): string {
    if (!date) {
      return '';
    }
    //ใช้ datepipe ในการ format date
    let transformedDate = this.datePipe.transform(date, 'MM/yyyy', 'th-TH')

    return transformedDate || "";
  }

  formatDateForDisplayForPdf(date: Date | null): string { // เพิ่มฟังก์ชันนี้
    if (!date) {
      return '';
    }
    //ใช้ datepipe ในการ format date
    let transformedDate = this.datePipe.transform(date, 'MMMM yyyy', 'th-TH')
    if (transformedDate) {
      const yearInBuddhistEra = date.getFullYear() + 543;
      return transformedDate.replace(date.getFullYear().toString(), yearInBuddhistEra.toString());
    }
    return "";
  }
}
