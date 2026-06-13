import { Component, OnInit } from '@angular/core';
import { CctvService, ICctvs, IDraft } from '../../../shareds/cctv.service';
import { forkJoin, of } from 'rxjs';

interface IGroupedDevices {
  switchName: string;
  realDevices: ICctvs[];
  draftDevices: IDraft[];
  otherRealDevices: ICctvs[];
  otherDraftDevices: IDraft[];
  totalRealCount: number;
  totalDraftCount: number;
  showOtherDevices?: boolean;
}

@Component({
  selector: 'app-cctv-topology',
  templateUrl: './cctv-topology.component.html',
  styleUrls: ['./cctv-topology.component.css']
})
export class CctvTopologyComponent implements OnInit {
  maps: any[] = [];
  selectedMapId: string = 'all'; // 'all' or numeric map ID
  
  cameras: ICctvs[] = [];
  drafts: IDraft[] = [];
  
  isLoading: boolean = false;
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  // Grouped results
  unassignedReal: ICctvs[] = [];
  unassignedDraft: IDraft[] = [];
  groupedSwitches: IGroupedDevices[] = [];
  
  // Local list of manually created empty switch names (to display empty cards)
  manualSwitches: string[] = [];

  // Set to keep track of switches with expanded "other map" devices
  expandedOtherDevicesSwitches: Set<string> = new Set<string>();

  // Toggle to show switches that do not have any devices on the current map
  showOtherMapSwitches: boolean = false;

  // Editing state
  editingSwitchName: string | null = null;
  newGroupNameInput: string = '';
  showAddSwitchModal: boolean = false;
  newSwitchName: string = '';

  constructor(private cctvService: CctvService) { }

  ngOnInit(): void {
    this.loadData();
  }

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.clearToast(), 3000);
  }

  clearToast() {
    this.toastMessage = '';
  }

  loadData() {
    this.isLoading = true;
    this.cctvService.get_maps().subscribe({
      next: (res: any) => {
        this.maps = res.result || [];
        this.loadDevices();
      },
      error: (err) => {
        console.error('Error loading maps', err);
        this.showToast('ไม่สามารถโหลดข้อมูลแผนที่ได้', 'error');
        this.isLoading = false;
      }
    });
  }

  loadDevices() {
    this.isLoading = true;
    
    // 1. Fetch all real cameras (type 1)
    this.cctvService.get_cctv('1').subscribe({
      next: (res: any) => {
        this.cameras = res.result || [];
        
        // 2. Fetch drafts
        // If 'all' maps is selected, fetch drafts for all maps. Otherwise, fetch for selected map.
        const draftRequests: any[] = [];
        if (this.selectedMapId === 'all') {
          this.maps.forEach(map => {
            draftRequests.push(this.cctvService.getDrafts(map.id));
          });
        } else {
          draftRequests.push(this.cctvService.getDrafts(this.selectedMapId));
        }

        if (draftRequests.length === 0) {
          this.drafts = [];
          this.groupDevices();
          this.isLoading = false;
          return;
        }

        forkJoin(draftRequests).subscribe({
          next: (draftResponses: any[]) => {
            let allDrafts: IDraft[] = [];
            draftResponses.forEach(res => {
              if (res && res.result) {
                allDrafts = allDrafts.concat(res.result);
              }
            });
            this.drafts = allDrafts;
            this.groupDevices();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading drafts', err);
            this.drafts = [];
            this.groupDevices();
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading cameras', err);
        this.showToast('ไม่สามารถโหลดข้อมูลกล้องได้', 'error');
        this.isLoading = false;
      }
    });
  }

  groupDevices() {
    const currentMapId = this.selectedMapId;
    
    // Extract unique switch names globally from ALL loaded cameras and drafts
    const switchNamesSet = new Set<string>();
    
    this.cameras.forEach(c => {
      if (c.switch_name && c.switch_name.trim() !== '' && c.switch_name.trim() !== '0') {
        switchNamesSet.add(c.switch_name.trim());
      }
    });

    this.drafts.forEach(d => {
      if (d.switch_name && d.switch_name.trim() !== '' && d.switch_name.trim() !== '0') {
        switchNamesSet.add(d.switch_name.trim());
      }
    });

    // Add manual empty switches (if they are not already in the set)
    this.manualSwitches.forEach(sw => {
      if (sw && sw.trim() !== '' && sw.trim() !== '0') {
        switchNamesSet.add(sw.trim());
      }
    });

    // Group items:
    // We display switches globally, but filter the devices listed inside the card by map.
    const switchesList: IGroupedDevices[] = [];
    switchNamesSet.forEach(name => {
      const allRealForSw = this.cameras.filter(c => c.switch_name === name);
      const allDraftForSw = this.drafts.filter(d => d.switch_name === name);

      const realOnMap = allRealForSw.filter(c => currentMapId === 'all' || (c.map_id && c.map_id.toString() === currentMapId));
      const draftOnMap = allDraftForSw.filter(d => currentMapId === 'all' || (d.map_id && d.map_id.toString() === currentMapId));

      const otherReal = currentMapId === 'all' ? [] : allRealForSw.filter(c => !c.map_id || c.map_id.toString() !== currentMapId);
      const otherDraft = currentMapId === 'all' ? [] : allDraftForSw.filter(d => !d.map_id || d.map_id.toString() !== currentMapId);

      switchesList.push({
        switchName: name,
        realDevices: realOnMap,
        draftDevices: draftOnMap,
        otherRealDevices: otherReal,
        otherDraftDevices: otherDraft,
        totalRealCount: allRealForSw.length,
        totalDraftCount: allDraftForSw.length,
        showOtherDevices: this.expandedOtherDevicesSwitches.has(name)
      });
    });

    if (currentMapId !== 'all' && !this.showOtherMapSwitches) {
      this.groupedSwitches = switchesList.filter(sw => 
        sw.realDevices.length > 0 || 
        sw.draftDevices.length > 0 || 
        this.manualSwitches.includes(sw.switchName)
      );
    } else {
      this.groupedSwitches = switchesList;
    }
    
    // Unassigned pools (filtered by map)
    const filteredReal = this.cameras.filter(c => 
      currentMapId === 'all' || (c.map_id && c.map_id.toString() === currentMapId)
    );
    const filteredDraft = this.drafts.filter(d => 
      currentMapId === 'all' || (d.map_id && d.map_id.toString() === currentMapId)
    );

    this.unassignedReal = filteredReal.filter(c => !c.switch_name || c.switch_name.trim() === '' || c.switch_name.trim() === '0');
    this.unassignedDraft = filteredDraft.filter(d => !d.switch_name || d.switch_name.trim() === '' || d.switch_name.trim() === '0');
  }

  onMapFilterChange() {
    // Clear manual empty switch templates when filtering, to start fresh
    this.manualSwitches = [];
    this.loadDevices();
  }

  toggleOtherDevices(switchName: string) {
    if (this.expandedOtherDevicesSwitches.has(switchName)) {
      this.expandedOtherDevicesSwitches.delete(switchName);
    } else {
      this.expandedOtherDevicesSwitches.add(switchName);
    }
    
    const sw = this.groupedSwitches.find(g => g.switchName === switchName);
    if (sw) {
      sw.showOtherDevices = this.expandedOtherDevicesSwitches.has(switchName);
    }
  }

  // --- Switch Management Actions ---

  openAddSwitchModal() {
    this.newSwitchName = '';
    this.showAddSwitchModal = true;
  }

  closeAddSwitchModal() {
    this.showAddSwitchModal = false;
  }

  addNewSwitch() {
    const name = this.newSwitchName.trim();
    if (!name) {
      this.showToast('กรุณากรอกชื่อ Switch', 'warning');
      return;
    }

    // Check if group already exists
    const exists = this.groupedSwitches.some(g => g.switchName.toLowerCase() === name.toLowerCase()) || 
                   this.manualSwitches.some(s => s.toLowerCase() === name.toLowerCase());

    if (exists) {
      this.showToast('มี Switch ชื่อนี้อยู่ในระบบแล้ว', 'warning');
      return;
    }

    this.manualSwitches.push(name);
    this.groupDevices();
    this.closeAddSwitchModal();
    this.showToast('เพิ่มกลุ่ม Switch สำเร็จ', 'success');
  }

  startRename(switchName: string) {
    this.editingSwitchName = switchName;
    this.newGroupNameInput = switchName;
  }

  cancelRename() {
    this.editingSwitchName = null;
  }

  saveRename(oldName: string) {
    const newName = this.newGroupNameInput.trim();
    if (!newName) {
      this.showToast('ชื่อ Switch ห้ามว่าง', 'warning');
      return;
    }

    if (oldName === newName) {
      this.editingSwitchName = null;
      return;
    }

    this.isLoading = true;
    this.cctvService.renameSwitch(oldName, newName).subscribe({
      next: (res: any) => {
        if (res.result) {
          // Update manual switches list if it was a manual empty switch
          const idx = this.manualSwitches.indexOf(oldName);
          if (idx !== -1) {
            this.manualSwitches[idx] = newName;
          }

          // Update local models immediately for responsive UI
          this.cameras.forEach(c => {
            if (c.switch_name === oldName) c.switch_name = newName;
          });
          this.drafts.forEach(d => {
            if (d.switch_name === oldName) d.switch_name = newName;
          });

          this.editingSwitchName = null;
          this.groupDevices();
          this.showToast('เปลี่ยนชื่อ Switch สำเร็จ', 'success');
        } else {
          this.showToast('ไม่สามารถเปลี่ยนชื่อได้: ' + res.message, 'error');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Rename error', err);
        this.showToast('เกิดข้อผิดพลาดในการเปลี่ยนชื่อ', 'error');
        this.isLoading = false;
      }
    });
  }

  deleteSwitchGroup(switchName: string) {
    // If there are devices connected, warn the user
    const group = this.groupedSwitches.find(g => g.switchName === switchName);
    const hasDevices = group && (group.realDevices.length > 0 || group.draftDevices.length > 0);

    if (hasDevices) {
      if (!confirm(`Switch "${switchName}" ยังมีกล้องต่อเชื่อมอยู่ คุณต้องการยกเลิกการเชื่อมต่อกล้องทั้งหมดเพื่อลบกลุ่มใช่หรือไม่?`)) {
        return;
      }
    }

    this.isLoading = true;
    
    // Clear switch_name in DB for all assigned devices in this group
    const updateRequests: any[] = [];

    if (group) {
      group.realDevices.forEach(c => {
        const updated = { ...c, switch_name: undefined };
        updateRequests.push(this.cctvService.put_cctv(c.id, updated));
      });
      group.draftDevices.forEach(d => {
        updateRequests.push(this.cctvService.updateDraft(d.id, { switch_name: '' }));
      });
    }

    // Remove from manual list
    this.manualSwitches = this.manualSwitches.filter(s => s !== switchName);

    if (updateRequests.length === 0) {
      this.groupDevices();
      this.isLoading = false;
      this.showToast('ลบกลุ่ม Switch สำเร็จ', 'success');
      return;
    }

    forkJoin(updateRequests).subscribe({
      next: () => {
        // Re-load devices to pull clean database records
        this.loadDevices();
        this.showToast('ลบกลุ่ม Switch และย้ายกล้องไปที่ยังไม่ได้ระบุแล้ว', 'success');
      },
      error: (err) => {
        console.error('Delete group error', err);
        this.showToast('เกิดข้อผิดพลาดในการลบกลุ่ม Switch', 'error');
        this.isLoading = false;
      }
    });
  }

  // --- Assign Device Action (Direct/Fallback Dropdown) ---

  assignDeviceToSwitch(item: any, isDraft: boolean, targetSwitchName: string | null) {
    const switchNameValue = targetSwitchName ? targetSwitchName : '';
    
    if (!isDraft) {
      const updatedDevice = { ...item, switch_name: switchNameValue };
      this.cctvService.put_cctv(item.id, updatedDevice).subscribe({
        next: () => {
          item.switch_name = switchNameValue;
          this.groupDevices();
          this.showToast(`บันทึกการจัดกลุ่ม ${item.durable_name || item.location} สำเร็จ`, 'success');
        },
        error: () => this.showToast('ไม่สามารถบันทึกข้อมูลได้', 'error')
      });
    } else {
      this.cctvService.updateDraft(item.id, { switch_name: switchNameValue }).subscribe({
        next: () => {
          item.switch_name = switchNameValue;
          this.groupDevices();
          this.showToast(`วางแผนการจัดกลุ่มกล้องดราฟสำเร็จ`, 'success');
        },
        error: () => this.showToast('ไม่สามารถบันทึกข้อมูลการวางแผนได้', 'error')
      });
    }
  }

  // --- Drag & Drop Implementation ---

  onDragStart(event: DragEvent, item: any, isDraft: boolean) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('device_id', item.id.toString());
      event.dataTransfer.setData('is_draft', isDraft ? 'true' : 'false');
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetSwitchName: string | null) {
    event.preventDefault();
    if (!event.dataTransfer) return;

    const deviceId = event.dataTransfer.getData('device_id');
    const isDraft = event.dataTransfer.getData('is_draft') === 'true';

    // Find the item locally
    let itemToAssign: any = null;
    if (isDraft) {
      itemToAssign = this.drafts.find(d => d.id!.toString() === deviceId);
    } else {
      itemToAssign = this.cameras.find(c => c.id!.toString() === deviceId);
    }

    if (itemToAssign) {
      this.assignDeviceToSwitch(itemToAssign, isDraft, targetSwitchName);
    }
  }

  // --- Printing/Export report ---
  exportReport() {
    window.print();
  }

  getMapName(mapId: any): string {
    const map = this.maps.find(m => m.id == mapId);
    return map ? map.name : 'Unknown';
  }

  getDraftNumber(draft: IDraft): number {
    const mapDrafts = this.drafts.filter(d => d.map_id === draft.map_id);
    mapDrafts.sort((a, b) => (a.id || 0) - (b.id || 0));
    const idx = mapDrafts.findIndex(d => d.id === draft.id);
    return idx !== -1 ? idx + 1 : 0;
  }
}
