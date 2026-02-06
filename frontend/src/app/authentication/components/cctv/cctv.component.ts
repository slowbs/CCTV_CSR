import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CctvService, ICctvs, IFloor, IStatus } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
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
}

