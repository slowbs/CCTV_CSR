import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CctvService, ICctvs, IFloor, IStatus, IAuditLog, ILogPing } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from '../../../../assets/font/vfs_fonts';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

pdfMake.addFonts({
  Sarabun: {
    normal: 'Sarabun-Regular.ttf',
    bold: 'Sarabun-Bold.ttf',
  },
});

declare const $: any;

@Component({
  selector: 'app-cctv',
  templateUrl: './cctv.component.html',
  styleUrls: ['./cctv.component.css']
})
export class CctvComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public cctvItems: ICctvs[] = [];
  public allItems: ICctvs[] = []; // Store original data for filtering
  public model: ICctvs;
  public statusItems: IStatus[] = [];
  public floorItems: IFloor[] = [];
  private cctvType: string | undefined; // ตัวแปรเก็บประเภทของครุภัณฑ์
  public isLoading: boolean = true; // กำลังโหลดข้อมูล
  AppUrl = AppURL
  AuthUrl = AuthenticationURL
  Title = 'รายงานข้อมูล';

  searchText: string = '';

  // Toast notification
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
  }

  clearToast() {
    this.toastMessage = '';
  }

  constructor(private CctvSerivce: CctvService, private route: ActivatedRoute) {
    this.model = this.CctvSerivce.updateModel;
  }

  ngOnInit() {

    this.isLoading = true; //แสดง Loading
    // ดึงค่าพารามิเตอร์จาก URL
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.cctvType = params.get('type') || undefined; // เก็บค่าประเภทของครุภัณฑ์
        const titles: { [key: string]: string } = {
          '1': 'กล้องโทรทัศน์วงจรปิด',
          '2': 'เครื่องคอมพิวเตอร์แม่ข่าย',
          '3': 'อุปกรณ์กระจายสัญญาณ',
          '4': 'อุปกรณ์จัดเก็บข้อมูล'
        };
        if (this.cctvType) {
          this.get_Cctv(this.cctvType); // เรียกใช้ get_Cctv พร้อมพารามิเตอร์
          this.searchText = '';
          this.Title = titles[this.cctvType] || 'รายงานข้อมูล';
        }
      });
    this.getStatus(); //ดึงค่าสถานะมาแสดง
    this.getFloor(); //ดึงค่าชั้นมาแสดง
  }

  get_Cctv(type?: string) {
    this.isLoading = true;
    this.CctvSerivce.get_cctv(type) // ส่ง type ไปยัง service
      .subscribe({
        next: (result) => {
          if (result && result['result']) { // ตรวจสอบว่า result มีข้อมูล
            this.allItems = result['result'];
            this.onSearchItem(); // Apply existing filters
          } else {
            this.cctvItems = []; // หากไม่มีผลลัพธ์ให้กำหนดให้เป็นอาร์เรย์ว่าง
            this.allItems = [];
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading CCTV:', err);
          this.cctvItems = [];
          this.allItems = [];
          this.isLoading = false;
          this.showToast('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
        }
      });
  }

  getStatus() {
    return this.CctvSerivce.get_status()
      .subscribe({
        next: (result) => {
          this.statusItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
          // Default select all statuses
          this.selectedStatusIds = this.statusItems.map(s => s.status_id!).filter(id => id);
        },
        error: (err) => {
          console.error('Error loading status:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลสถานะได้', 'warning');
        }
      });
  }

  getFloor() {
    return this.CctvSerivce.get_floor()
      .subscribe({
        next: (result) => {
          this.floorItems = result['result'] || []; // ป้องกัน error หาก result เป็น null
        },
        error: (err) => {
          console.error('Error loading floor:', err);
          this.showToast('ไม่สามารถโหลดข้อมูลชั้นได้', 'warning');
        }
      });
  }

  onSubmit() {
    console.log(this.model)
    this.CctvSerivce.put_cctv(this.model.id, this.model)
      .subscribe({
        next: (result) => {
          console.log(result);
          $('#editCctvModal').modal('hide');
          this.showToast('บันทึกข้อมูลสำเร็จ', 'success');
          this.get_Cctv(this.cctvType); // เรียก get_Cctv ใหม่หลังการบันทึก
        },
        error: (err) => {
          console.error('Error saving:', err);
          this.showToast(err.error?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
        }
      });
  }

  onEditModal(items: ICctvs) {
    Object.assign(this.CctvSerivce.updateModel, items);
    this.selectedImageFile = null; // Reset file selection when opening modal
  }

  // Image upload properties and methods
  selectedImageFile: File | null = null;
  isUploading: boolean = false;

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
    }
  }

  getImageUrl(imagePath: string): string {
    return `http://${window.location.hostname}/CCTV_CSR/backend/uploads/devices/${imagePath}`;
  }

  uploadImage() {
    if (!this.selectedImageFile || !this.model.id) return;

    this.isUploading = true;
    this.CctvSerivce.uploadImage(this.model.id, this.selectedImageFile)
      .subscribe({
        next: (result: any) => {
          this.model.image_path = result.image_path;
          this.updateItemInArrays(this.model.id!, 'image_path', result.image_path);
          this.selectedImageFile = null;
          this.isUploading = false;
          this.showToast('อัพโหลดรูปภาพสำเร็จ', 'success');
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          this.isUploading = false;
          this.showToast(err.error?.message || 'ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่', 'error');
        }
      });
  }

  deleteImage() {
    if (!this.model.id || !this.model.image_path) return;
    // Open confirmation modal instead of native confirm()
    ($('#deleteImageModal') as any).modal('show');
  }

  confirmDeleteImage() {
    if (!this.model.id) return;

    this.isUploading = true;
    ($('#deleteImageModal') as any).modal('hide');

    this.CctvSerivce.deleteImage(this.model.id)
      .subscribe({
        next: () => {
          this.model.image_path = undefined;
          this.updateItemInArrays(this.model.id!, 'image_path', undefined);
          this.isUploading = false;
          this.showToast('ลบรูปภาพสำเร็จ', 'success');
        },
        error: (err) => {
          console.error('Error deleting image:', err);
          this.isUploading = false;
          this.showToast(err.error?.message || 'ไม่สามารถลบรูปภาพได้ กรุณาลองใหม่', 'error');
        }
      });
  }

  // Helper to update item in both arrays
  updateItemInArrays(itemId: string, field: string, value: any) {
    const updateItem = (arr: ICctvs[]) => {
      const item = arr.find(i => i.id === itemId);
      if (item) (item as any)[field] = value;
    };
    updateItem(this.allItems);
    updateItem(this.cctvItems);
  }

  selectedStatusIds: string[] = ['1', '2', '3', '4']; // Default show all

  // Connection filter options
  connectionOptions = [
    { key: 'online', label: 'Online', icon: 'bi-wifi' },
    { key: 'offline', label: 'Offline', icon: 'bi-wifi-off' },
    { key: 'ma', label: 'Maintenance', icon: 'bi-tools' }
  ];
  selectedConnectionTypes: string[] = ['online', 'offline', 'ma']; // Default show all

  onSearchItem() {
    let tempItems = this.allItems;

    // 1. Filter by Status (lifecycle)
    if (this.statusItems.length > 0 && this.selectedStatusIds.length > 0) {
      tempItems = tempItems.filter(item => {
        return item.status_id && this.selectedStatusIds.includes(item.status_id);
      });
    }

    // 2. Filter by Connection (operational state)
    if (this.selectedConnectionTypes.length > 0 && this.selectedConnectionTypes.length < 3) {
      tempItems = tempItems.filter(item => {
        const isMA = item.maintenance_mode == 1;
        const isOnline = item.ping === '0' && !isMA;
        const isOffline = item.ping !== '0' && !isMA;

        return (this.selectedConnectionTypes.includes('ma') && isMA) ||
          (this.selectedConnectionTypes.includes('online') && isOnline) ||
          (this.selectedConnectionTypes.includes('offline') && isOffline);
      });
    }

    // 3. Filter by Text
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      tempItems = tempItems.filter(item => {
        return (item.durable_no && item.durable_no.toLowerCase().includes(term)) ||
          (item.durable_name && item.durable_name.toLowerCase().includes(term)) ||
          (item.brand && item.brand.toLowerCase().includes(term)) ||
          (item.model && item.model.toLowerCase().includes(term)) ||
          (item.location && item.location.toLowerCase().includes(term)) ||
          (item.floor && item.floor.toLowerCase().includes(term)) ||
          (item.ip && item.ip.toLowerCase().includes(term));
      });
    }

    this.cctvItems = tempItems;
  }

  onStatusChange(statusId: string, isChecked: boolean) {
    if (isChecked) {
      if (!this.selectedStatusIds.includes(statusId)) {
        this.selectedStatusIds.push(statusId);
      }
    } else {
      this.selectedStatusIds = this.selectedStatusIds.filter(id => id !== statusId);
    }
    this.onSearchItem();
  }

  onConnectionChange(connectionKey: string, isChecked: boolean) {
    if (isChecked) {
      if (!this.selectedConnectionTypes.includes(connectionKey)) {
        this.selectedConnectionTypes.push(connectionKey);
      }
    } else {
      this.selectedConnectionTypes = this.selectedConnectionTypes.filter(k => k !== connectionKey);
    }
    this.onSearchItem();
  }

  onResetSearch() {
    this.searchText = '';
    if (this.statusItems.length > 0) {
      this.selectedStatusIds = this.statusItems.map(s => s.status_id!);
    } else {
      this.selectedStatusIds = ['1', '2', '3', '4'];
    }
    this.selectedConnectionTypes = ['online', 'offline', 'ma'];
    this.cctvItems = this.allItems;
  }

  selectAllStatuses() {
    this.selectedStatusIds = this.statusItems.map(s => s.status_id!).filter(id => id);
    this.onSearchItem();
  }

  clearAllStatuses() {
    this.selectedStatusIds = [];
    this.onSearchItem();
  }

  selectAllConnections() {
    this.selectedConnectionTypes = this.connectionOptions.map(c => c.key);
    this.onSearchItem();
  }

  clearAllConnections() {
    this.selectedConnectionTypes = [];
    this.onSearchItem();
  }

  // --- History Modal Properties ---
  selectedCctvForHistory: ICctvs | null = null;
  activeHistoryTab: 'maintenance' | 'audit' = 'maintenance';
  historyAuditLogs: IAuditLog[] = [];
  historyPingLogs: ILogPing[] = [];
  historyLoading: boolean = false;

  // Pagination for History Audit Logs
  historyAuditPage = 1;
  historyAuditPageSize = 10;
  historyAuditTotal = 0;
  historyAuditPages: number[] = [];

  // Log Ping action models
  editCommentModel: any = { log_id: 0, comment: '' };
  deletePingLogModel: ILogPing | null = null;

  onHistoryModal(item: ICctvs) {
    this.selectedCctvForHistory = item;
    this.activeHistoryTab = 'maintenance';
    this.historyAuditPage = 1;
    this.historyAuditLogs = [];
    this.historyPingLogs = [];
    this.loadHistoryData();
  }

  loadHistoryData() {
    if (!this.selectedCctvForHistory || !this.selectedCctvForHistory.id) return;
    this.historyLoading = true;

    // Load log pings (maintenance logs)
    this.CctvSerivce.get_logping(undefined, this.selectedCctvForHistory.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.historyPingLogs = res.result || [];
          this.preparePingLogsWithDowntime();
          this.historyLoading = false;
        },
        error: (err) => {
          console.error('Error loading history log ping:', err);
          this.historyPingLogs = [];
          this.historyLoading = false;
        }
      });

    // Load audit logs (detail change logs)
    this.loadHistoryAuditLogs();
  }

  loadHistoryAuditLogs() {
    if (!this.selectedCctvForHistory || !this.selectedCctvForHistory.id) return;
    this.historyLoading = true;
    this.CctvSerivce.get_audit_logs(+this.selectedCctvForHistory.id, this.historyAuditPage, this.historyAuditPageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.historyAuditLogs = res.result || [];
          this.historyAuditTotal = res.total || 0;
          this.generateHistoryAuditPages();
          this.historyLoading = false;
        },
        error: (err) => {
          console.error('Error loading history audit logs:', err);
          this.historyAuditLogs = [];
          this.historyLoading = false;
        }
      });
  }

  changeHistoryAuditPage(page: number) {
    const totalPages = Math.ceil(this.historyAuditTotal / this.historyAuditPageSize);
    if (page >= 1 && page <= totalPages && page !== this.historyAuditPage) {
      this.historyAuditPage = page;
      this.loadHistoryAuditLogs();
    }
  }

  generateHistoryAuditPages() {
    const totalPages = Math.ceil(this.historyAuditTotal / this.historyAuditPageSize);
    const maxPagesToShow = 5;
    this.historyAuditPages = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        this.historyAuditPages.push(i);
      }
    } else {
      this.historyAuditPages.push(1);
      let startPage = Math.max(2, this.historyAuditPage - 1);
      let endPage = Math.min(totalPages - 1, this.historyAuditPage + 1);

      if (this.historyAuditPage <= 3) {
        endPage = 4;
      }
      if (this.historyAuditPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }

      if (startPage > 2) {
        this.historyAuditPages.push(-1);
      }

      for (let i = startPage; i <= endPage; i++) {
        this.historyAuditPages.push(i);
      }

      if (endPage < totalPages - 1) {
        this.historyAuditPages.push(-1);
      }
      this.historyAuditPages.push(totalPages);
    }
  }

  formatDateBE(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const yearBE = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${yearBE} ${hours}:${minutes}`;
  }

  onHistoryCommentEdit(log: any) {
    this.editCommentModel = {
      log_id: log.log_id,
      comment: log.comment || ''
    };
    $('#historyEditCommentModal').modal('show');
  }

  onSubmitHistoryComment() {
    this.CctvSerivce.put_logping(this.editCommentModel.log_id, this.editCommentModel)
      .subscribe({
        next: (res) => {
          $('#historyEditCommentModal').modal('hide');
          this.showToast('บันทึกข้อมูลสำเร็จ', 'success');
          this.loadHistoryData();
          this.CctvSerivce.notifyNavbarToRefresh();
        },
        error: (err) => {
          console.error('Error saving comment:', err);
          this.showToast('ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
      });
  }

  onDeleteHistoryLog(log: ILogPing) {
    this.deletePingLogModel = log;
    $('#historyDeleteLogModal').modal('show');
  }

  onConfirmDeleteHistoryLog() {
    if (!this.deletePingLogModel) return;
    this.CctvSerivce.delete_logping(this.deletePingLogModel.log_id)
      .subscribe({
        next: () => {
          $('#historyDeleteLogModal').modal('hide');
          this.showToast('ลบ Log สำเร็จ', 'success');
          this.deletePingLogModel = null;
          this.loadHistoryData();
          this.CctvSerivce.notifyNavbarToRefresh();
        },
        error: (err) => {
          console.error('Error deleting log:', err);
          this.showToast('ไม่สามารถลบ Log ได้', 'error');
        }
      });
  }

  getHistoryPingStatusText(pingChecked: string): string {
    switch (pingChecked) {
      case '0': return 'Online';
      case '1': return 'Offline';
      case '2': return 'Start MA';
      case '3': return 'End MA';
      default: return 'Unknown';
    }
  }

  calculateOfflineDuration(offline: string | Date | number, online: string | Date | number): string {
    if (!offline || !online) return "";
    const offlineDate = new Date(offline);
    const onlineDate = new Date(online);
    const diffInMs = onlineDate.getTime() - offlineDate.getTime();
    if (diffInMs < 0) return 'N/A';
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const days = Math.floor(diffInMinutes / (60 * 24));
    const hours = Math.floor((diffInMinutes % (60 * 24)) / 60);
    const minutes = diffInMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} วัน`);
    if (hours > 0) parts.push(`${hours} ชั่วโมง`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} นาที`);
    return parts.join(' ');
  }

  preparePingLogsWithDowntime(): void {
    if (!this.historyPingLogs || this.historyPingLogs.length === 0) return;

    // 1. Initialize properties for all logs
    for (const log of this.historyPingLogs) {
      log.rowSpan = 1;
      log.durationText = '-';
      log.mergedComment = log.comment || '';
    }

    // 2. Perform pairing using State-Machine from oldest to newest (newest is index 0)
    let pendingOffline: ILogPing | null = null;
    let pendingOfflineIndex: number | null = null;

    let pendingMA: ILogPing | null = null;
    let pendingMAIndex: number | null = null;

    for (let i = this.historyPingLogs.length - 1; i >= 0; i--) {
      const log = this.historyPingLogs[i];

      if (log.ping_checked === '1') {
        pendingOffline = log;
        pendingOfflineIndex = i;
      } else if (log.ping_checked === '0') {
        if (pendingOffline && pendingOfflineIndex !== null) {
          const duration = this.calculateOfflineDuration(pendingOffline.date_created, log.date_created);

          // Check if adjacent in the array (meaning adjacent rows in descending display)
          if (pendingOfflineIndex === i + 1) {
            // Merge cells: online (top/current) gets rowSpan=2, offline (bottom/pending) gets rowSpan=0 (hidden)
            log.rowSpan = 2;
            pendingOffline.rowSpan = 0;
            log.durationText = duration;
            log.mergedComment = pendingOffline.comment || '';
          } else {
            // Interleaved: separate cells (rowSpan=1), duration and comment stay in their respective places
            log.rowSpan = 1;
            log.durationText = '-';
            log.mergedComment = '';

            pendingOffline.rowSpan = 1;
            pendingOffline.durationText = duration;
            pendingOffline.mergedComment = pendingOffline.comment || '';
          }
          pendingOffline = null;
          pendingOfflineIndex = null;
        }
      } else if (log.ping_checked === '2') {
        pendingMA = log;
        pendingMAIndex = i;
      } else if (log.ping_checked === '3') {
        if (pendingMA && pendingMAIndex !== null) {
          const duration = this.calculateOfflineDuration(pendingMA.date_created, log.date_created);

          // Check if adjacent in the array
          if (pendingMAIndex === i + 1) {
            log.rowSpan = 2;
            pendingMA.rowSpan = 0;
            log.durationText = duration;
            log.mergedComment = pendingMA.comment || '';
          } else {
            log.rowSpan = 1;
            log.durationText = '-';
            log.mergedComment = '';

            pendingMA.rowSpan = 1;
            pendingMA.durationText = duration;
            pendingMA.mergedComment = pendingMA.comment || '';
          }
          pendingMA = null;
          pendingMAIndex = null;
        }
      }
    }

    // 3. Handle outstanding unpaired pending logs (currently active outages/MA)
    const now = new Date();
    if (pendingOffline) {
      const activeDuration = this.calculateOfflineDuration(new Date(pendingOffline.date_created), now);
      pendingOffline.rowSpan = 1;
      pendingOffline.durationText = `ออฟไลน์อยู่ (สะสม ${activeDuration})`;
      pendingOffline.mergedComment = pendingOffline.comment || '';
    }
    if (pendingMA) {
      const activeDuration = this.calculateOfflineDuration(new Date(pendingMA.date_created), now);
      pendingMA.rowSpan = 1;
      pendingMA.durationText = `อยู่ระหว่างซ่อมบำรุง (สะสม ${activeDuration})`;
      pendingMA.mergedComment = pendingMA.comment || '';
    }
  }

  exportHistoryPDF(): void {
    if (!this.selectedCctvForHistory || this.historyPingLogs.length === 0) return;

    const device = this.selectedCctvForHistory;
    const titleText = `ประวัติการซ่อมบำรุงและการเชื่อมต่อ (${this.Title})`;

    // Create details table
    const detailsTable = {
      margin: [0, 0, 0, 15] as [number, number, number, number],
      table: {
        widths: ['18%', '32%', '18%', '32%'],
        body: [
          [
            { text: 'เลขครุภัณฑ์:', bold: true },
            { text: device.durable_no || '-' },
            { text: 'ชื่อครุภัณฑ์:', bold: true },
            { text: this.segmentThaiText(device.durable_name || '-') }
          ],
          [
            { text: 'สถานที่ / ชั้น:', bold: true },
            { text: this.segmentThaiText(`${device.location || '-'} (ชั้น ${device.floor || '-'})`) },
            { text: 'ยี่ห้อ / รุ่น:', bold: true },
            { text: `${device.brand || '-'} / ${device.model || '-'}` }
          ],
          [
            { text: 'IP Address:', bold: true },
            { text: device.ip || '-' },
            { text: 'วันที่ออกรายงาน:', bold: true },
            { text: this.formatDateBE(new Date().toISOString()) }
          ]
        ]
      },
      layout: 'noBorders' as any
    };

    // Create table body
    const tableBody: any[][] = [];

    // Header row
    tableBody.push([
      { text: 'ลำดับ Log', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานะ', style: 'tableHeader', alignment: 'center' },
      { text: 'วันเวลา', style: 'tableHeader', alignment: 'center' },
      { text: 'หมายเหตุการปฏิบัติงาน / อาการเสีย', style: 'tableHeader', alignment: 'center' },
      { text: 'ระยะเวลาขัดข้อง (Downtime)', style: 'tableHeader', alignment: 'center' }
    ]);

    // Data rows
    this.historyPingLogs.forEach(log => {
      const statusText = this.getHistoryPingStatusText(log.ping_checked);
      const dateText = this.formatDateBE(log.date_created);

      const commentCell = log.rowSpan !== undefined && log.rowSpan > 0
        ? { text: this.segmentThaiText(log.mergedComment || '-'), rowSpan: log.rowSpan }
        : '';

      const durationCell = log.rowSpan !== undefined && log.rowSpan > 0
        ? { text: this.segmentThaiText(log.durationText || '-'), rowSpan: log.rowSpan, alignment: 'center' as any, style: 'downtimeText' }
        : '';

      tableBody.push([
        { text: log.log_id, alignment: 'center' },
        { text: statusText, alignment: 'center', style: this.getStatusStyle(log.ping_checked) },
        { text: dateText, alignment: 'center' },
        commentCell,
        durationCell
      ]);
    });

    const docDefinition = {
      defaultStyle: {
        font: 'Sarabun',
        fontSize: 9
      },
      content: [
        { text: titleText, style: 'header', alignment: 'center', margin: [0, 0, 0, 15] as [number, number, number, number] },
        detailsTable,
        {
          table: {
            headerRows: 1,
            widths: ['10%', '15%', '22%', '33%', '20%'],
            body: tableBody
          }
        }
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fillColor: '#f8f9fa',
          alignment: 'center'
        },
        downtimeText: {
          bold: true
        },
        statusOnline: {
          color: '#198754',
          bold: true
        },
        statusOffline: {
          color: '#dc3545',
          bold: true
        },
        statusMA: {
          color: '#ffc107',
          bold: true
        },
        statusEndMA: {
          color: '#0dcaf0',
          bold: true
        }
      }
    };

    const fileName = `history_${device.durable_no || 'device'}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  exportAuditPDF(): void {
    if (!this.selectedCctvForHistory || !this.selectedCctvForHistory.id) return;
    this.historyLoading = true;

    // Fetch all audit logs for this device (without pagination limit)
    this.CctvSerivce.get_audit_logs(+this.selectedCctvForHistory.id, 1, 999999)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.generateAuditPDF(res.result || []);
          this.historyLoading = false;
        },
        error: (err) => {
          console.error('Error fetching audit logs for export:', err);
          this.showToast('ไม่สามารถดาวน์โหลดรายงานประวัติการแก้ไขได้', 'error');
          this.historyLoading = false;
        }
      });
  }

  generateAuditPDF(logs: IAuditLog[]): void {
    if (!this.selectedCctvForHistory) return;

    const device = this.selectedCctvForHistory;
    const titleText = `ประวัติการแก้ไขรายละเอียดครุภัณฑ์ (${this.Title})`;

    const detailsTable = {
      margin: [0, 0, 0, 15] as [number, number, number, number],
      table: {
        widths: ['18%', '32%', '18%', '32%'],
        body: [
          [
            { text: 'เลขครุภัณฑ์:', bold: true },
            { text: device.durable_no || '-' },
            { text: 'ชื่อครุภัณฑ์:', bold: true },
            { text: this.segmentThaiText(device.durable_name || '-') }
          ],
          [
            { text: 'สถานที่ / ชั้น:', bold: true },
            { text: this.segmentThaiText(`${device.location || '-'} (ชั้น ${device.floor || '-'})`) },
            { text: 'ยี่ห้อ / รุ่น:', bold: true },
            { text: `${device.brand || '-'} / ${device.model || '-'}` }
          ],
          [
            { text: 'IP Address:', bold: true },
            { text: device.ip || '-' },
            { text: 'วันที่ออกรายงาน:', bold: true },
            { text: this.formatDateBE(new Date().toISOString()) }
          ]
        ]
      },
      layout: 'noBorders' as any
    };

    const tableBody: any[][] = [];
    tableBody.push([
      { text: 'ลำดับ Log', style: 'tableHeader', alignment: 'center' },
      { text: 'ชั้น', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานที่', style: 'tableHeader', alignment: 'center' },
      { text: 'รายละเอียด', style: 'tableHeader', alignment: 'center' },
      { text: 'สถานะ', style: 'tableHeader', alignment: 'center' },
      { text: 'IP Address', style: 'tableHeader', alignment: 'center' },
      { text: 'วันเวลาที่แก้ไข', style: 'tableHeader', alignment: 'center' }
    ]);

    logs.forEach(log => {
      tableBody.push([
        { text: log.id.toString(), alignment: 'center' },
        { text: this.getDiffPdfContent(log.old_floor, log.new_floor), alignment: 'center' },
        { text: this.getDiffPdfContent(log.old_location, log.new_location) },
        { text: this.getDiffPdfContent(log.old_monitor, log.new_monitor) },
        { text: this.getDiffPdfContent(log.old_status, log.new_status), alignment: 'center' },
        { text: this.getDiffPdfContent(log.old_ip, log.new_ip), alignment: 'center' },
        { text: this.formatDateBE(log.updated_at), alignment: 'center' }
      ]);
    });

    const docDefinition = {
      defaultStyle: {
        font: 'Sarabun',
        fontSize: 9
      },
      content: [
        { text: titleText, style: 'header', alignment: 'center', margin: [0, 0, 0, 15] as [number, number, number, number] },
        detailsTable,
        {
          table: {
            headerRows: 1,
            widths: ['10%', '12%', '19%', '19%', '12%', '14%', '14%'],
            body: tableBody
          }
        }
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fillColor: '#f8f9fa',
          alignment: 'center'
        }
      }
    };

    const fileName = `audit_history_${device.durable_no || 'device'}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  getDiffPdfContent(oldVal: string | null | undefined, newVal: string | null | undefined): any {
    const oldStr = oldVal || '-';
    const newStr = newVal || '-';
    if (oldStr !== newStr) {
      return [
        { text: this.segmentThaiText(oldStr), color: '#b02a37' },
        { text: ' -> ', color: '#6c757d' },
        { text: this.segmentThaiText(newStr), color: '#146c43', bold: true }
      ];
    }
    return this.segmentThaiText(newStr);
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

  private getStatusStyle(pingChecked: string): string {
    switch (pingChecked) {
      case '0': return 'statusOnline';
      case '1': return 'statusOffline';
      case '2': return 'statusMA';
      case '3': return 'statusEndMA';
      default: return '';
    }
  }
}

