import { Component, OnInit, OnDestroy } from '@angular/core';
import { CctvService, ICctvs } from '../../../shareds/cctv.service';

declare var $: any;

interface FloorGroup {
  floor_name: string;
  floor_order: number;
  items: ICctvs[];
  onlineCount: number;
  offlineCount: number;
  maCount: number;
}

@Component({
  selector: 'app-monitor-cctv',
  templateUrl: './monitor-cctv.component.html',
  styleUrls: ['./monitor-cctv.component.css']
})
export class MonitorCctvComponent implements OnInit, OnDestroy {
  isLoading = true;
  floors: FloorGroup[] = [];
  private intervalId: any;
  selectedItem: ICctvs | null = null; // For modal details

  constructor(private cctvService: CctvService) { }

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

  openDetailModal(item: ICctvs): void {
    this.selectedItem = item;
    $('#cctvDetailModal').modal('show');
  }

  closeDetailModal(): void {
    $('#cctvDetailModal').modal('hide');
  }

  loadData(): void {
    // Type 1 = CCTV
    this.cctvService.get_cctv('1').subscribe({
      next: (res: any) => {
        if (res && res.result) {
          this.groupDevices(res.result);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading CCTV data', err);
        this.isLoading = false;
      }
    });
  }

  groupDevices(items: ICctvs[]): void {
    const groups: { [key: string]: FloorGroup } = {};

    items.forEach(item => {
      // Filter only active status if needed, but usually monitor shows all
      if (item.status_id !== '1') return;

      const floorName = item.floor || 'Unknown';

      if (!groups[floorName]) {
        groups[floorName] = {
          floor_name: floorName,
          floor_order: item.floor_order ? parseInt(item.floor_order) : 999,
          items: [],
          onlineCount: 0,
          offlineCount: 0,
          maCount: 0
        };
      }

      const group = groups[floorName];
      group.items.push(item);

      if (item.maintenance_mode == 1) {
        group.maCount++;
      } else if (item.ping === '0') {
        group.onlineCount++;
      } else {
        group.offlineCount++; // Offline
      }
    });

    // Sort floors by order
    this.floors = Object.values(groups).sort((a, b) => a.floor_order - b.floor_order);
  }
}
