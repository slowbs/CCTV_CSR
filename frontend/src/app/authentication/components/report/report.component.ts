import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CctvService, IReport } from '../../../shareds/cctv.service';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';
import { BsLocaleService, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { thLocale } from 'ngx-bootstrap/locale';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';

defineLocale('th', thLocale);
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
  startDate: Date | null = null;
  endDate: Date | null = null;
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;
  bsConfig: Partial<BsDatepickerConfig>;

  constructor(
    private cctvService: CctvService,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private localeService: BsLocaleService
  ) {
    this.localeService.use('th');
    this.bsConfig = Object.assign({}, {
      dateInputFormat: 'DD/MM/YYYY',
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
        const today = new Date();
        // กำหนด tempStartDate เป็นวันที่ 1 ของเดือนก่อนหน้า
        this.tempStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        // กำหนด tempEndDate เป็นวันสุดท้ายของเดือนก่อนหน้า
        this.tempEndDate = new Date(today.getFullYear(), today.getMonth(), 0);

        //กำหนดค่าเริ่มต้นให้ startDate และ endDate
        this.startDate = this.tempStartDate;
        this.endDate = this.tempEndDate;

        this.get_report(id, this.startDate, this.endDate);
        this.Title = titles[id] || 'รายงานข้อมูล';
      }
    });
  }

  private segmentThaiText(text: string): string {
    if (!text) return "";
    if ('Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments.map(segment => segment.segment).join('\u00AD');
    }
    return text;
  }

  generatePDF(): void {
    const documentDefinition = {
      defaultStyle: {
        font: 'Sarabun',
        fontSize: 8
      },
      content: [
        { text: 'รายงานข้อมูล' + this.Title, style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        {
          text: this.startDate && this.endDate ? `ข้อมูลวันที่ ${this.formatDateForDisplay(this.startDate)} - ${this.formatDateForDisplay(this.endDate)}` : '',
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
          // fillColor: '#2980b9',
          // color: 'white'
        }
      }
    };

    pdfMake.createPdf(documentDefinition).download('report.pdf');
  }

  // แก้ไข getTableContent()
  getTableContent() {
    const body: any[][] = [];
    body.push([
      { text: 'ที่', style: 'tableHeader', alignment: 'center' },
      { text: 'รายการ', style: 'tableHeader', alignment: 'center' },
      { text: 'เลขครุภัณฑ์', style: 'tableHeader', alignment: 'center' },
      { text: 'ชั้น', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานที่', style: 'tableHeader', alignment: 'center' },
      { text: 'รายละเอียด', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานะ', style: 'tableHeader', alignment: 'center' },
      { text: 'Ping', style: 'tableHeader', alignment: 'center' },
      { text: 'หมายเหตุ', style: 'tableHeader', alignment: 'center' }
    ]);

    this.reportItems.forEach((item, index) => {
      const logs = item.logs && item.logs.length > 0 ? item.logs : [];
      const rowSpan = logs.length > 0 ? logs.length : 1;

      if (logs.length > 0) {
        body.push([
          { text: (index + 1).toString(), alignment: 'center', rowSpan: rowSpan },
          { text: this.segmentThaiText(item.durable_name), rowSpan: rowSpan },
          { text: item.durable_no, alignment: 'center', rowSpan: rowSpan },
          { text: item.floor, alignment: 'center', rowSpan: rowSpan }, // แสดงชั้น
          { text: this.segmentThaiText(item.location), rowSpan: rowSpan },
          { text: item.monitor, rowSpan: rowSpan }, // แสดง Monitor
          { text: this.segmentThaiText(item.status), alignment: 'center', rowSpan: rowSpan },
          { text: item.ping === '0' ? 'Online' : 'Offline', alignment: 'center', rowSpan: rowSpan },
          { text: `${logs[0].comment || ''} \n ออฟไลน์: ${this.formatDate(logs[0].offline)} \n ออนไลน์: ${this.formatDate(logs[0].online)} \n ระยะเวลา: ${logs[0].duration}` } //หมายเหตุ
        ]);
        for (let i = 1; i < logs.length; i++) {
          body.push([
            '', '', '', '', '', '', '', '',
            { text: `${logs[i].comment || ''} \n ออฟไลน์: ${this.formatDate(logs[i].offline)} \n ออนไลน์: ${this.formatDate(logs[i].online)} \n ระยะเวลา: ${logs[i].duration}` } //หมายเหตุ
          ]);
        }
      } else {
        body.push([
          { text: (index + 1).toString(), alignment: 'center' },
          { text: this.segmentThaiText(item.durable_name) },
          { text: item.durable_no, alignment: 'center' },
          { text: item.floor, alignment: 'center' }, // แสดงชั้น
          { text: this.segmentThaiText(item.location) },
          { text: item.monitor }, // แสดง Monitor
          { text: this.segmentThaiText(item.status), alignment: 'center' },
          { text: item.ping === '0' ? 'Online' : 'Offline', alignment: 'center' },
          { text: '' }
        ]);
      }
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', 60, 60, 'auto', 70, 50, 40, 'auto', '*'],
        body: body
      }
    };
  }

  get_report(id: string, startDate: Date, endDate: Date): void {
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd') || undefined;
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd') || undefined;

    this.cctvService.get_report(id, start, end).subscribe(result => {
      this.reportItems = Object.values(result['result']);
      // แก้ไขการเรียงลำดับโดยใช้ Number() แปลง string เป็นตัวเลข
      this.reportItems.sort((a, b) => {
        return Number(a.floor_order) - Number(b.floor_order);
      });
      this.reportItems.forEach(item => {
        item.logs = item.logs.filter(log => log.offline);
        item.logs.forEach(log => {
          log.duration = this.calculateOfflineDuration(log.offline, log.online);
        });
      });
      // console.log(this.reportItems)
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
      this.startDate = this.tempStartDate;
      this.endDate = this.tempEndDate;
      this.get_report(id, this.startDate, this.endDate);
    }
  }
}
