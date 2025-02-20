import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CctvService, IReport } from '../../../shareds/cctv.service';
// นำเข้า pdfMake และ pdfFonts จาก pdfmake package
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { thLocale } from 'ngx-bootstrap/locale';

defineLocale('th', thLocale);

// ใช้ฟอนต์ที่มาพร้อมกับ pdfMake (Roboto)
// หากคุณต้องการใช้ฟอนต์ภาษาไทย (เช่น Sarabun) คุณต้อง embed ฟอนต์ภาษาไทยเองและตั้งค่า pdfMake.fonts ให้ถูกต้อง
(<any>pdfMake).addVirtualFileSystem(pdfFonts);

pdfMake.addFonts({
  Sarabun: {
    normal: 'Sarabun-Regular.ttf',
    bold: 'Sarabun-Bold.ttf',
  },
});

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  public reportItems: IReport.Report[] = [];
  reportTitle = 'รายงานข้อมูล';
  startDate: string;
  endDate: string;

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private localeService: BsLocaleService
  ) {
    this.localeService.use('th');
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const titles: { [key: string]: string } = {
        '1': 'รายงานข้อมูลกล้องโทรทัศน์วงจรปิด',
        '2': 'รายงานข้อมูลเครื่องคอมพิวเตอร์แม่ข่าย',
        '3': 'รายงานข้อมูลอุปกรณ์กระจายสัญญาณ',
        '4': 'รายงานข้อมูลอุปกรณ์จัดเก็บข้อมูล'
      };
      if (id) {
        this.get_report(id);
        this.reportTitle = titles[id] || 'รายงานข้อมูล';
      }
    });
  }

  // ฟังก์ชันสำหรับแยกคำภาษาไทยด้วย Intl.Segmenter
  // join ด้วยช่องว่าง เพื่อให้มี breakpoint สำหรับการ wrap
  private segmentThaiText(text: string): string {
    if (!text) return "";
    if ('Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      // join ด้วย space (คุณสามารถเปลี่ยนเป็น '\u200B' หรือ soft hyphen (\u00AD) ได้ตามที่ต้องการ)
      return segments.map(segment => segment.segment).join('\u00AD');
    }
    return text;
  }

  generatePDF(): void {
    const documentDefinition = {
      defaultStyle: {
        font: 'Sarabun', // เปลี่ยนเป็น 'Sarabun' หากคุณ embedฟอนต์ภาษาไทยไว้แล้ว
        fontSize: 8
      },
      content: [
        { text: this.reportTitle, style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
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

    pdfMake.createPdf(documentDefinition).download('report.pdf');
  }

  // สร้างเนื้อหาตารางสำหรับ pdfMake
  // ฟังก์ชัน getTableContent() ที่สร้าง table body โดยใช้ rowSpan สำหรับคอลัมน์ 1-6
  getTableContent() {
    const body: any[][] = [];

    // สร้าง header row (8 คอลัมน์)
    body.push([
      { text: 'ลำดับที่', style: 'tableHeader', alignment: 'center' },
      { text: 'รายการ', style: 'tableHeader', alignment: 'center' },
      { text: 'เลขครุภัณฑ์', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานที่', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานะ', style: 'tableHeader', alignment: 'center' },
      { text: 'Ping', style: 'tableHeader', alignment: 'center' },
      { text: 'วัน/เวลา', style: 'tableHeader', alignment: 'center' },
      { text: 'หมายเหตุ', style: 'tableHeader', alignment: 'center' }
    ]);

    // วนลูปข้อมูลแต่ละ item
    this.reportItems.forEach((item, index) => {
      const logs = item.logs && item.logs.length > 0 ? item.logs : [];
      const rowSpan = logs.length > 0 ? logs.length : 1;

      if (logs.length > 0) {
        // แถวแรกของ item: รวมข้อมูลหลักด้วย rowSpan แล้วแสดง log แรกในคอลัมน์ "วัน/เวลา" และ "หมายเหตุ"
        body.push([
          { text: (index + 1).toString(), alignment: 'center', rowSpan: rowSpan },
          { text: this.segmentThaiText(item.durable_name), rowSpan: rowSpan },
          { text: item.durable_no, alignment: 'center', rowSpan: rowSpan },
          { text: this.segmentThaiText(item.location), rowSpan: rowSpan },
          { text: this.segmentThaiText(item.status), alignment: 'center', rowSpan: rowSpan },
          { text: item.ping === '0' ? 'Online' : 'Offline', alignment: 'center', rowSpan: rowSpan },
          { text: `ออฟไลน์: ${this.formatDate(logs[0].offline)}\nออนไลน์: ${this.formatDate(logs[0].online)}\nระยะเวลา: ${logs[0].duration}` },
          { text: logs[0].comment || '' }
        ]);

        // แถวสำหรับ log ที่เหลือ (ถ้ามี)
        for (let i = 1; i < logs.length; i++) {
          body.push([
            '', '', '', '', '', '',
            { text: `ออฟไลน์: ${this.formatDate(logs[i].offline)}\nออนไลน์: ${this.formatDate(logs[i].online)}\nระยะเวลา: ${logs[i].duration}` },
            { text: logs[i].comment || '' }
          ]);
        }
      } else {
        // ถ้าไม่มี logs ให้สร้างแถวเดียวโดยไม่มี rowSpan
        body.push([
          { text: (index + 1).toString(), alignment: 'center' },
          { text: this.segmentThaiText(item.durable_name) },
          { text: item.durable_no, alignment: 'center' },
          { text: this.segmentThaiText(item.location) },
          { text: this.segmentThaiText(item.status), alignment: 'center' },
          { text: item.ping === '0' ? 'Online' : 'Offline', alignment: 'center' },
          { text: '' },
          { text: '' }
        ]);
      }
    });

    return {
      table: {
        headerRows: 1,
        // กำหนดความกว้างของคอลัมน์ (คุณสามารถปรับแต่งเพิ่มเติมตามความเหมาะสม)
        widths: ['auto', 60, 'auto', 70, 40, 'auto', 110, '*'],
        body: body
      }
    };
  }

  get_report(id: string): void {
    this.cctvService.get_report(id).subscribe(result => {
      this.reportItems = Object.values(result['result']);
      this.reportItems.forEach(item => {
        item.logs = item.logs.filter(log => log.offline);
        item.logs.forEach(log => {
          log.duration = this.calculateOfflineDuration(log.offline, log.online);
        });
      });
    });
  }

  formatDate(date: string): string {
    if (!date) return "";
    const jsDate = new Date(date);
    const transformedDate = this.datePipe.transform(jsDate, 'dd MMM yyyy HH:mm', 'th-TH');
    if (transformedDate) {
      const yearInBuddhistEra = jsDate.getFullYear() + 543;
      return transformedDate.replace(jsDate.getFullYear().toString(), yearInBuddhistEra.toString());
    }
    return "";
  }


  calculateOfflineDuration(offline: string, online: string): string {
    if (!offline || !online) return "";
    const offlineDate = new Date(offline);
    const onlineDate = new Date(online);
    const diffInMs = onlineDate.getTime() - offlineDate.getTime();
    if (diffInMs < 0) return 'N/A';
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const days = Math.floor(diffInMinutes / (60 * 24));
    const hours = Math.floor((diffInMinutes % (60 * 24)) / 60);
    const minutes = diffInMinutes % 60;
    return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`;
  }

  onSubmitDateRange() {
    console.log('Start Date:', this.datePipe.transform(this.startDate, 'yyyy-MM-dd'));
    console.log('End Date:', this.datePipe.transform(this.endDate, 'yyyy-MM-dd'));
  }
}