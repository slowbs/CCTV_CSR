import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CctvService, IReport } from '../../../shareds/cctv.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { sarabunRegular } from '../../../../assets/font/Sarabun-Regular-normal'; // นำเข้า Base64

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  public reportItems: IReport.Report[] = [];
  reportTitle = 'รายงานข้อมูล';

  constructor(private cctvService: CctvService, private route: ActivatedRoute, private datePipe: DatePipe) { }

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

  generatePDF() {
    const doc = new jsPDF('p', 'mm', 'a4');

    // โหลดฟอนต์จาก Base64
    doc.addFileToVFS('Sarabun-Regular.ttf', sarabunRegular);
    doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
    doc.setFont('Sarabun'); // ตั้งค่าเริ่มต้น

    doc.setFontSize(12);
    doc.text(this.reportTitle, 105, 15, { align: 'center' });

    const columns = [
      { header: 'ลำดับที่', dataKey: 'index' },
      { header: 'รายการ', dataKey: 'durable_name' },
      { header: 'เลขครุภัณฑ์', dataKey: 'durable_no' },
      { header: 'สถานที่', dataKey: 'location' },
      { header: 'สถานะ', dataKey: 'status' },
      { header: 'Ping', dataKey: 'ping' },
      { header: 'วัน/เวลา', dataKey: 'log_time' },
      { header: 'หมายเหตุ', dataKey: 'comment' }
    ];

    const rows: any[] = [];

    this.reportItems.forEach((item, i) => {
      if (item.logs?.length) {
        item.logs.forEach((log, j) => {
          rows.push({
            index: j === 0 ? i + 1 : '',
            durable_name: j === 0 ? item.durable_name : '',
            durable_no: j === 0 ? item.durable_no : '',
            location: j === 0 ? item.location : '',
            status: j === 0 ? item.status : '',
            ping: j === 0 ? (item.ping === '0' ? 'Online' : 'Offline') : '',
            log_time: `ออฟไลน์: ${this.formatDate(log.offline) || ''}\nออนไลน์: ${this.formatDate(log.online) || ''}\nระยะเวลา: ${log.duration || ''}`,
            comment: log.comment || ''
          });
        });
      } else {
        rows.push({
          index: i + 1,
          durable_name: item.durable_name,
          durable_no: item.durable_no,
          location: item.location,
          status: item.status,
          ping: item.ping === '0' ? 'Online' : 'Offline',
          log_time: '',
          comment: ''
        });
      }
    });

    autoTable(doc, {
      columns,
      body: rows,
      startY: 20,
      theme: 'grid',  // เปลี่ยนเป็น grid เพื่อแสดงเส้นขอบทั้งหมด
      styles: {
        font: 'Sarabun',
        fontSize: 8,
        overflow: 'linebreak',
        lineColor: [0, 0, 0],   // กำหนดสีเส้น cell border เป็นสีดำ
        lineWidth: 0.1,          // กำหนดความหนาเส้นของ cell border
      },
      headStyles: { fillColor: [41, 128, 185], overflow: 'linebreak', halign: 'center' },
      columnStyles: {
        index: { cellWidth: 12, halign: 'center' },
        durable_name: { cellWidth: 30 },
        durable_no: { cellWidth: 25, halign: 'center' },
        location: { cellWidth: 30, overflow: 'linebreak' },
        status: { cellWidth: 20, halign: 'center' },
        ping: { cellWidth: 15, halign: 'center' },
        log_time: { cellWidth: 40 },
      },
      tableLineColor: [0, 0, 0],   // สีดำ
      tableLineWidth: 0.1,         // ความหนา 0.1 มม.
      margin: { top: 20, left: 5, right: 5 }
    });

    doc.save('report.pdf');
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

  formatDate(date: string): string | null {
    if (!date) return null;
    const jsDate = new Date(date);
    const transformedDate = this.datePipe.transform(jsDate, 'dd MMM yyyy HH:mm', 'th-TH');
    if (transformedDate) {
      const yearInBuddhistEra = jsDate.getFullYear() + 543;
      return transformedDate.replace(jsDate.getFullYear().toString(), yearInBuddhistEra.toString());
    }
    return null;
  }

  calculateOfflineDuration(offline: string, online: string): string | null {
    if (!offline || !online) return null;
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
