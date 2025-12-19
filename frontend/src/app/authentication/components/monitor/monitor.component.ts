import { Component, OnInit, OnDestroy } from '@angular/core';
import { CctvService, ICctvs } from '../../../shareds/cctv.service';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';

interface RackSlot {
  durable_no: string;
  durable_name: string;
  monitor?: string; // Added monitor property
  items: ICctvs[];
}

interface FloorRack {
  floor_id: string;
  floor_name: string;
  floor_order: number;
  slots: RackSlot[];
  hasOffline: boolean;
  hasMaintenance: boolean;
  offlineCount: number;
  maintenanceCount: number;
}

declare var $: any;

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit, OnDestroy {
  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  isLoading = true;
  floorRacks: FloorRack[] = [];
  selectedItem: ICctvs | null = null;
  private intervalId: any;
  allItems: ICctvs[] = []; // Store all loaded items
  showDisconnected: boolean = false;

  toggleDisconnected(): void {
    this.showDisconnected = !this.showDisconnected;
    this.groupDevices(this.allItems);
  }

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
    $('#detailModal').modal('show');
  }

  closeDetailModal(): void {
    $('#detailModal').modal('hide');
  }

  loadData(): void {
    this.isLoading = true;
    const types = ['2', '3', '4'];
    const promises = types.map(type => this.cctvService.get_cctv(type).toPromise());

    Promise.all(promises).then(results => {
      this.allItems = [];
      results.forEach((res: any) => {
        if (res && res.result) {
          this.allItems = this.allItems.concat(res.result);
        }
      });
      this.groupDevices(this.allItems);
      this.isLoading = false;
    }).catch(err => {
      console.error('Error loading data', err);
      this.isLoading = false;
    });
  }

  groupDevices(items: ICctvs[]): void {
    const floors: { [key: string]: FloorRack } = {};

    items.forEach(item => {
      // 1. Global Filter: Always hide Write-off (3, 4)
      if (item.status_id === '3' || item.status_id === '4') return;

      // 2. Toggle Filter: Hide Disconnected (2) if toggle is OFF
      if (!this.showDisconnected && item.status_id === '2') return;

      // 3. Skip if not Active (1) and not Disconnected (2) - Safety check
      // Also skip Status 2 if we are hiding them (handled above)
      if (item.status_id !== '1' && item.status_id !== '2') return;

      // Skip if no IP ONLY for Active devices (1)
      // Disconnected devices (2) might be spares (no IP), so we show them.
      if (item.status_id === '1' && (!item.ip || item.ip.trim() === '')) return;

      // Skip if no floor
      if (!item.floor) return;

      if (!floors[item.floor]) {
        floors[item.floor] = {
          floor_id: item.floor,
          floor_name: item.floor,
          floor_order: item.floor_order ? parseInt(item.floor_order) : 999,
          slots: [],
          hasOffline: false,
          hasMaintenance: false,
          offlineCount: 0,
          maintenanceCount: 0
        };
      }

      let slot: RackSlot | undefined;

      if (item.durable_no && item.durable_no !== '-') {
        slot = floors[item.floor].slots.find(s => s.durable_no === item.durable_no);
      }

      if (slot) {
        slot.items.push(item);
      } else {
        floors[item.floor].slots.push({
          durable_no: item.durable_no,
          durable_name: item.durable_name || '',
          monitor: item.monitor, // Populate monitor
          items: [item]
        });
      }
    });

    // Calculate status for each rack
    Object.values(floors).forEach(rack => {
      let offlineCount = 0;
      let maintenanceCount = 0;

      rack.slots.forEach(slot => {
        slot.items.forEach(item => {
          // Count Offline: Only if Active (Status 1) and ping is not 0
          if (item.ping !== '0' && item.status_id == '1') {
            offlineCount++;
          }
          if (item.maintenance_mode == 1) {
            maintenanceCount++;
          }
        });
      });

      rack.offlineCount = offlineCount;
      rack.maintenanceCount = maintenanceCount;
      rack.hasOffline = offlineCount > 0;
      rack.hasMaintenance = maintenanceCount > 0;
    });

    // Sort by floor_order (asc), then floor_name (asc) for stability
    this.floorRacks = Object.values(floors).sort((a, b) => {
      if (a.floor_order !== b.floor_order) {
        return a.floor_order - b.floor_order;
      }
      return a.floor_name.localeCompare(b.floor_name);
    });

    this.floorRacks.forEach(rack => {
      rack.slots.sort((a, b) => a.durable_name.localeCompare(b.durable_name));
    });
  }

  getBadgeClass(ping: string | undefined): string {
    return ping === '0' ? 'bg-success' : 'bg-danger';
  }

  getPingStatus(ping: string | undefined): string {
    return ping === '0' ? 'Online' : 'Offline';
  }


  getDeviceStatus(item: ICctvs): string {
    if (item.status_id == '2') return 'Disconnected';
    if (item.maintenance_mode == 1) return 'MA Mode';
    return item.ping === '0' ? 'Online' : 'Offline';
  }

  trackByRack(index: number, item: FloorRack): string {
    return item.floor_id; // Unique identifier for the rack
  }
}
