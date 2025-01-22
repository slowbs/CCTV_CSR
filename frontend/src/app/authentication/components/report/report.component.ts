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
  public reportItems: IReport.Report
  public userItems = [
    { id: '1', durable_no: '416 54 0411', durable_name: 'เครื่องคอมพิวเตอร์แม่ข่าย 1', location: 'ห้อง Server', floor: 'ชั้น 3', status_id: '1', ping: '0', offline: '2025-01-22 18:47:11', online: '2025-01-22 18:47:33' },
    { id: '2', durable_no: '416 54 0412', durable_name: 'เครื่องคอมพิวเตอร์แม่ข่าย 2', location: 'ห้อง Server', floor: 'ชั้น 3', status_id: '1', ping: '0', offline: '2025-01-22 18:47:11', online: '2025-01-22 18:47:33' },
  ];

  constructor(private cctvService: CctvService, private route: ActivatedRoute) { }

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
    this.cctvService.get_report(id)
      .subscribe(result => {
        this.reportItems = result['result'];
        console.log(this.reportItems);
      });
  }
}
