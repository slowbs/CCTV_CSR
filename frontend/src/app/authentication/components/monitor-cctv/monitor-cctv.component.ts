import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CctvService, ICctvs } from '../../../shareds/cctv.service';
import { environment } from '../../../../environments/environment';

declare var $: any;

interface IMap {
  id: number;
  name: string;
  image: string;
  image_url?: string;
  cctv_count?: number;
}

@Component({
  selector: 'app-monitor-cctv',
  templateUrl: './monitor-cctv.component.html',
  styleUrls: ['./monitor-cctv.component.css']
})
export class MonitorCctvComponent implements OnInit, OnDestroy {
  isLoading = true;
  maps: IMap[] = [];
  cameras: ICctvs[] = [];
  filteredCameras: ICctvs[] = [];

  selectedMap: IMap | null = null;
  selectedItem: ICctvs | null = null;
  searchText: string = '';

  private intervalId: any;

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

  // Backend URL helper
  private get backendUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return environment.API_LOCALHOST;
    } else if (window.location.hostname.startsWith('192.168')) {
      return environment.API_LOCALIP;
    } else {
      return environment.API_NGROK;
    }
  }

  constructor(private cctvService: CctvService, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadData();
    // Auto refresh every 60 seconds
    this.intervalId = setInterval(() => this.loadData(), 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadData(): void {
    this.loadMaps();
    this.loadCameras();
  }

  loadMaps(): void {
    this.http.get<any>(this.backendUrl + 'maps').subscribe({
      next: (res) => {
        if (res.result) {
          // Backend จัดเรียงตาม sort_order แล้ว
          this.maps = res.result;
          // Update selected map info if exists
          if (this.selectedMap) {
            const updated = this.maps.find(m => m.id == this.selectedMap!.id);
            if (updated) this.selectedMap = updated;
          }
        }
      },
      error: (err) => {
        console.error('Error loading maps', err);
        this.showToast('ไม่สามารถโหลดข้อมูลแผนที่ได้', 'error');
      }
    });
  }

  loadCameras(): void {
    // Type '1' = CCTV
    this.cctvService.get_cctv('1').subscribe({
      next: (res: any) => {
        if (res && res.result) {
          this.cameras = res.result
            .filter((c: any) => c.ip && c.ip.trim() !== '') // Only cameras with IP
            .filter((c: any) => c.status_id !== '3' && c.status_id !== '4') // Exclude Write-off
            .map((c: any) => ({
              ...c,
              map_x: c.map_x ? parseFloat(c.map_x) : null,
              map_y: c.map_y ? parseFloat(c.map_y) : null,
              map_id: c.map_id ? parseInt(c.map_id) : null
            }));
          this.filterCameras();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading CCTV data', err);
        this.isLoading = false;
        this.showToast('ไม่สามารถโหลดข้อมูลกล้องได้', 'error');
      }
    });
  }

  selectMap(map: IMap): void {
    this.selectedMap = map;
    this.searchText = '';
    this.filterCameras();
  }

  getMapCameras(): ICctvs[] {
    if (!this.selectedMap) return [];
    return this.cameras.filter(c => {
      if (c.map_id != this.selectedMap!.id) return false;

      // Status Logic
      if (c.status_id == '1') return true;
      if (this.showDisconnected && c.status_id == '2') return true;

      return false;
    });
  }

  // Get cameras for a specific map (by map id)
  getCamerasByMapId(mapId: number): ICctvs[] {
    return this.cameras.filter(c => c.map_id == mapId);
  }

  // Check if map has offline cameras (Active status only)
  hasMapOffline(mapId: number): boolean {
    return this.getCamerasByMapId(mapId).some(c => c.ping !== '0' && c.maintenance_mode != 1 && c.status_id == '1');
  }

  // Check if map has MA cameras (Active status only)
  hasMapMa(mapId: number): boolean {
    return this.getCamerasByMapId(mapId).some(c => c.maintenance_mode == 1 && c.status_id == '1');
  }

  // Check if map has Disconnected cameras (Cancelled status)
  hasMapDisconnected(mapId: number): boolean {
    return this.getCamerasByMapId(mapId).some(c => c.status_id == '2');
  }

  // Get map status: 'offline' | 'ma' | 'online'
  getMapStatus(mapId: number): string {
    if (this.hasMapOffline(mapId)) return 'offline';
    if (this.hasMapMa(mapId)) return 'ma';
    return 'online';
  }

  showDisconnected: boolean = false;

  toggleDisconnected(): void {
    this.showDisconnected = !this.showDisconnected;
    this.filterCameras();
  }

  filterCameras(): void {
    const mapCameras = this.getMapCameras();
    // Logic moved to getMapCameras for consistency between Map and List

    if (!this.searchText) {
      this.filteredCameras = mapCameras;
      return;
    }

    const term = this.searchText.toLowerCase();
    this.filteredCameras = mapCameras.filter(c => {
      return (c.location && c.location.toLowerCase().includes(term)) ||
        (c.ip && c.ip.includes(this.searchText)) ||
        (c.durable_name && c.durable_name.toLowerCase().includes(term)) ||
        (c.floor && c.floor.toLowerCase().includes(term)) ||
        (c.monitor && c.monitor.toLowerCase().includes(term));
    });
  }

  // Status Count Helpers - ALL cameras (ภาพรวมทั้งระบบ)
  getTotalCount(): number {
    return this.cameras.length;
  }

  getTotalOnlineCount(): number {
    return this.cameras.filter(c => c.ping === '0' && c.maintenance_mode != 1 && c.status_id == '1').length;
  }

  getTotalOfflineCount(): number {
    return this.cameras.filter(c => c.ping !== '0' && c.maintenance_mode != 1 && c.status_id == '1').length;
  }

  getTotalMaCount(): number {
    return this.cameras.filter(c => c.maintenance_mode == 1).length;
  }

  getTotalDisconnectedCount(): number {
    return this.cameras.filter(c => c.status_id == '2').length;
  }

  // Status Count Helpers - Selected Map (เฉพาะ map ที่เลือก)
  getOnlineCount(): number {
    return this.getMapCameras().filter(c => c.ping === '0' && c.maintenance_mode != 1 && c.status_id == '1').length;
  }

  getOfflineCount(): number {
    return this.getMapCameras().filter(c => c.ping !== '0' && c.maintenance_mode != 1 && c.status_id == '1').length;
  }

  getMaCount(): number {
    return this.getMapCameras().filter(c => c.maintenance_mode == 1).length;
  }

  getDisconnectedCount(): number {
    return this.getMapCameras().filter(c => c.status_id == '2').length;
  }

  // Modal
  openDetailModal(item: ICctvs): void {
    this.selectedItem = item;
    $('#cctvDetailModal').modal('show');
  }

  closeDetailModal(): void {
    $('#cctvDetailModal').modal('hide');
  }

  getDeviceImageUrl(imagePath: string): string {
    return `http://${window.location.hostname}/CCTV_CSR/backend/uploads/devices/${imagePath}`;
  }

  // Image Preview Modal
  previewImageUrl: string | null = null;

  openImagePreview(imagePath: string): void {
    this.previewImageUrl = this.getDeviceImageUrl(imagePath);
    // Use a timeout to ensure variable is set before modal opens, though not strictly necessary with Angular
    setTimeout(() => {
      ($('#imagePreviewModal') as any).modal('show');
    }, 0);
  }

  closeImagePreview(): void {
    ($('#imagePreviewModal') as any).modal('hide');
    this.previewImageUrl = null;
  }
}
