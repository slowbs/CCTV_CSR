import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CctvService, IReport } from '../../../shareds/cctv.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  // ข้อมูลตัวอย่างสำหรับ Report
  public reportItems: IReport.Report[] = [];

  constructor(private cctvService: CctvService, private route: ActivatedRoute, private datePipe: DatePipe) { }

  ngOnInit(): void {
    // ดึงค่าพารามิเตอร์ id จาก route และใช้เรียกข้อมูล log ping
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.get_report(id);
      }
    });
  }

  // ฟังก์ชันสำหรับสร้าง PDF
  generatePDF() {
    const element = document.getElementById('report-content');
    if (!element) return;

    html2canvas(element).then((canvas) => {
      const pdf = new jsPDF('p', 'mm', 'a4'); // สร้างไฟล์ PDF แบบ A4
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('report.pdf'); // ดาวน์โหลดไฟล์ PDF
    });
  }

  get_report(id: string) {
    this.cctvService.get_report(id).subscribe(result => {
      this.reportItems = result
    });
  }

  // แปลงวันที่เป็น วัน/เดือน/ปีพ.ศ.
  formatDate(date: string): string | null {
    if (!date) return null;

    const jsDate = new Date(date);
    const transformedDate = this.datePipe.transform(jsDate, 'dd MMMM yyyy HH:mm', 'th-TH');

    if (transformedDate) {
      // เพิ่มปี ค.ศ. อีก 543 ปีเพื่อแปลงเป็น พ.ศ.
      const yearInBuddhistEra = jsDate.getFullYear() + 543;
      return transformedDate.replace(jsDate.getFullYear().toString(), yearInBuddhistEra.toString());
    }
    return null;
  }

  // คำนวณระยะเวลา Offline
  calculateOfflineDuration(offline: string, online: string): string | null {
    if (!offline || !online) return null;

    const offlineDate = new Date(offline);
    const onlineDate = new Date(online);

    // คำนวณระยะเวลาระหว่างสองวัน
    const diffInMs = onlineDate.getTime() - offlineDate.getTime();

    if (diffInMs < 0) return 'N/A'; // กรณีที่เวลา online เร็วกว่าหรือผิดพลาด

    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const days = Math.floor(diffInMinutes / (60 * 24));
    const hours = Math.floor((diffInMinutes % (60 * 24)) / 60);
    const minutes = diffInMinutes % 60;

    return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`;
  }
}
