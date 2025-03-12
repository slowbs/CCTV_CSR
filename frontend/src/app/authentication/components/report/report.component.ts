import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CctvService, IReport } from '../../../shareds/cctv.service';
// นำเข้า pdfMake และ pdfFonts จาก pdfmake package
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';
import { BsLocaleService, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { thLocale } from 'ngx-bootstrap/locale';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';

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
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';
  startDate: Date | null = null; // วันที่เริ่มต้นที่ดึงข้อมูล และแสดงใน <p>
  endDate: Date | null = null; // วันที่สิ้นสุดที่ดึงข้อมูล และแสดงใน <p>
  tempStartDate: Date | null = null; // ตัวแปรชั่วคราวสำหรับ Datepicker
  tempEndDate: Date | null = null; // ตัวแปรชั่วคราวสำหรับ Datepicker
  bsConfig: Partial<BsDatepickerConfig>; // เพิ่ม BsDatepickerConfig

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private localeService: BsLocaleService
  ) {
    this.localeService.use('th');
    //กำหนดค่าเริ่มต้นให้ datepicker
    this.bsConfig = Object.assign({}, {
      dateInputFormat: 'DD/MM/YYYY',
      // containerClass: 'theme-dark-blue',
      isAnimated: true
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const titles: { [key: string]: string } = {
        '1': 'กล้องโทรทัศน์วงจรปิด',
        '2': 'เครื่องคอมพิวเตอร์แม่ข่าย',
        '3': 'อุปกรณ์กระจายสัญญาณ',
        '4': 'อุปกรณ์จัดเก็บข้อมูล'
      };
      if (id) {
        //กำหนดค่าเริ่มต้นให้ tempStartDate และ tempEndDate 
        this.tempStartDate = new Date();
        this.tempEndDate = new Date();

        //กำหนดค่าเริ่มต้นให้ startDate และ endDate
        this.startDate = new Date();
        this.endDate = new Date();

        this.get_report(id, this.startDate, this.endDate);
        this.Title = titles[id] || 'รายงานข้อมูล';
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
        { text: 'รายงานข้อมูล' + this.Title, style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        {
          text: this.startDate && this.endDate ? `ข้อมูลวันที่ ${this.formatDateForDisplay(this.startDate)} - ${this.formatDateForDisplay(this.endDate)}` : '',
          alignment: 'center',
          margin: [0, 0, 0, 10] // เพิ่ม margin ล่างเพื่อเว้นระยะห่าง
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

  get_report(id: string, startDate: Date, endDate: Date): void {
    // แปลงวันที่เป็น string ในรูปแบบที่ API ต้องการ (เช่น 'yyyy-MM-dd')
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd') || undefined;
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd') || undefined;

    this.cctvService.get_report(id, start, end).subscribe(result => {
      this.reportItems = Object.values(result['result']);
      this.reportItems.forEach(item => {
        item.logs = item.logs.filter(log => log.offline);
        item.logs.forEach(log => {
          log.duration = this.calculateOfflineDuration(log.offline, log.online);
        });
      });
      console.log(this.reportItems)
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

  formatDateForDisplay(date: Date | null): string {
    if (!date) {
      return '';
    }
    //ใช้ datepipe ในการ format date
    let transformedDate = this.datePipe.transform(date, 'dd MMM yyyy', 'th-TH')
    if (transformedDate) {
      const yearInBuddhistEra = date.getFullYear() + 543;
      return transformedDate.replace(date.getFullYear().toString(), yearInBuddhistEra.toString());
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

  onSubmitDateRange(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.tempStartDate && this.tempEndDate) {
      // คัดลอกค่าจาก tempStartDate และ tempEndDate ไปยัง startDate และ endDate
      this.startDate = this.tempStartDate;
      this.endDate = this.tempEndDate;
      this.get_report(id, this.startDate, this.endDate);
    }
  }
}
