import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CctvService, IReport } from '../../../shareds/cctv.service';
// นำเข้า pdfMake และ pdfFonts จาก pdfmake package
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';

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

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) { }

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
  getTableContent() {
    const body: any[] = [];
    // header row (เพิ่มคอลัมน์ "หมายเหตุ")
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

    this.reportItems.forEach((item, index) => {
      if (item.logs && item.logs.length > 0) {
        item.logs.forEach((log, logIndex) => {
          if (logIndex === 0) {
            body.push([
              { text: (index + 1).toString(), alignment: 'center' },
              { text: this.segmentThaiText(item.durable_name) },
              { text: item.durable_no },
              { text: this.segmentThaiText(item.location) },
              { text: this.segmentThaiText(item.status), alignment: 'center' },
              { text: item.ping === '0' ? 'Online' : 'Offline' },
              { text: `ออฟไลน์: ${this.formatDate(log.offline)}\nออนไลน์: ${this.formatDate(log.online)}\nระยะเวลา: ${log.duration}` },
              { text: log.comment || '' }
            ]);
          } else {
            body.push([
              { text: '' },
              { text: '' },
              { text: '' },
              { text: '' },
              { text: '' },
              { text: '' },
              { text: `ออฟไลน์: ${this.formatDate(log.offline)}\nออนไลน์: ${this.formatDate(log.online)}\nระยะเวลา: ${log.duration}` },
              { text: log.comment || '' }
            ]);
          }
        });
      } else {
        body.push([
          { text: (index + 1).toString(), alignment: 'center' },
          { text: this.segmentThaiText(item.durable_name) },
          { text: item.durable_no },
          { text: this.segmentThaiText(item.location) },
          { text: this.segmentThaiText(item.status), alignment: 'center' },
          { text: item.ping === '0' ? 'Online' : 'Offline' },
          { text: '' },
          { text: '' }
        ]);
      }
    });

    return {
      table: {
        headerRows: 1,
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
}