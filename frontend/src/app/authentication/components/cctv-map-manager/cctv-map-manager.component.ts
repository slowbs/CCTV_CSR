import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  selector: 'app-cctv-map-manager',
  templateUrl: './cctv-map-manager.component.html',
  styleUrls: ['./cctv-map-manager.component.css']
})
export class CctvMapManagerComponent implements OnInit {

  maps: IMap[] = [];
  cameras: ICctvs[] = [];
  filteredCameras: ICctvs[] = [];
  cameraToRemove: ICctvs | null = null;

  selectedMap: IMap | null = null;
  newMapData = { name: '', imageFile: null as File | null };
  searchText: string = '';
  filterType: 'all' | 'unmapped' | 'current' = 'unmapped';

  isLoading = false;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

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
    this.loadMaps();
    this.loadCameras();
  }

  // --- Data Loading ---

  loadMaps() {
    this.http.get<any>(this.backendUrl + 'maps').subscribe(res => {
      if (res.result) {
        this.maps = res.result;
        // Update selected map info if exists
        if (this.selectedMap) {
          const updated = this.maps.find(m => m.id == this.selectedMap!.id);
          if (updated) this.selectedMap = updated;
        }
      }
    });
  }

  loadCameras() {
    // Type '1' = CCTV
    this.cctvService.get_cctv('1').subscribe((res: any) => {
      if (res && res.result) {
        this.cameras = res.result.map((c: any) => ({
          ...c,
          // Convert string position to number for calculations
          map_x: c.map_x ? parseFloat(c.map_x) : null,
          map_y: c.map_y ? parseFloat(c.map_y) : null,
          map_id: c.map_id ? parseInt(c.map_id) : null
        }));
        this.filterCameras();
      }
    });
  }

  filterCameras() {
    this.filteredCameras = this.cameras.filter(c => {
      const term = this.searchText.toLowerCase();
      const matchesSearch = !this.searchText ||
        (c.location && c.location.toLowerCase().includes(term)) ||
        (c.ip && c.ip.includes(this.searchText)) ||
        (c.floor && c.floor.toLowerCase().includes(term)) ||
        (c.monitor && c.monitor.toLowerCase().includes(term)) ||
        (c.durable_no && c.durable_no.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      if (this.filterType === 'unmapped') {
        return !c.map_id;
      }
      if (this.filterType === 'current') {
        // Loose equality to handle string vs number ID
        return this.selectedMap && c.map_id == (this.selectedMap.id as any);
      }
      return true;
    });
  }

  // --- Map Actions ---

  selectMap(map: IMap) {
    this.selectedMap = map;
  }

  getMapCameras() {
    if (!this.selectedMap) return [];
    return this.cameras.filter(c => c.map_id == this.selectedMap!.id);
  }

  getMapName(mapId: any): string {
    const map = this.maps.find(m => m.id == mapId);
    return map ? map.name : 'Unknown';
  }

  moveCameraToCurrentMap(cam: ICctvs) {
    if (!this.selectedMap) return;
    if (!confirm(`Move ${cam.durable_name} to logic ${this.selectedMap.name}?`)) return;

    this.updateCameraPosition(cam, this.selectedMap.id, 50, 50); // Default center
  }

  openCreateMapModal() {
    this.newMapData = { name: '', imageFile: null };
    $('#createMapModal').modal('show');
  }

  closeModal() {
    $('#createMapModal').modal('hide');
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.newMapData.imageFile = event.target.files[0];
    }
  }

  createMap() {
    if (!this.newMapData.name || !this.newMapData.imageFile) {
      alert('Please enter name and select image');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.newMapData.name);
    formData.append('image', this.newMapData.imageFile);

    this.http.post<any>(this.backendUrl + 'maps', formData).subscribe(res => {
      if (res.result) {
        this.loadMaps();
        this.closeModal();
        // Select the new map?
      } else {
        alert('Error creating map: ' + res.message);
      }
    });
  }

  deleteMap(map: IMap, event: Event) {
    event.stopPropagation();
    if (!confirm(`Delete map "${map.name}"? Cameras will be unmapped.`)) return;

    this.http.delete<any>(this.backendUrl + 'maps', { params: { id: map.id.toString() } }).subscribe(res => {
      if (res.result) {
        this.loadMaps();
        if (this.selectedMap?.id === map.id) {
          this.selectedMap = null;
        }
        // Reload cameras to refresh map_id status
        this.loadCameras();
      }
    });
  }

  // --- Drag & Drop Logic ---

  onDragStart(event: DragEvent, cam: ICctvs) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('cctv_id', cam.id!.toString());
      event.dataTransfer.effectAllowed = 'move';

      // Use the ghost element as drag image
      const ghost = document.getElementById('drag-ghost');
      if (ghost) {
        event.dataTransfer.setDragImage(ghost, 12, 12); // Center the 24x24 marker
      }
    }
  }


  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer!.dropEffect = 'move';
  }

  onDropOnCanvas(event: DragEvent) {
    event.preventDefault();
    if (!this.selectedMap) return;

    const cctvId = event.dataTransfer!.getData('cctv_id');
    const cam = this.cameras.find(c => c.id == cctvId);

    if (cam) {
      // Calculate position relative to the image
      const container = this.mapContainer.nativeElement as HTMLElement;
      const rect = container.getBoundingClientRect();

      // Mouse position relative to the container
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert to percentage
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      // Clamp values 0-100
      const finalX = Math.max(0, Math.min(100, xPercent));
      const finalY = Math.max(0, Math.min(100, yPercent));

      this.updateCameraPosition(cam, this.selectedMap.id, finalX, finalY);
    }
  }

  updateCameraPosition(cam: ICctvs, mapId: number, x: number, y: number) {
    // Optimistic Query Update (Instant feedback)
    cam.map_id = mapId; // Cast to any if type mismatch logic
    cam.map_x = x;
    cam.map_y = y;

    const payload = {
      cctv_id: cam.id,
      map_id: mapId,
      x: x,
      y: y
    };

    this.http.put<any>(this.backendUrl + 'maps/cctv', payload).subscribe({
      next: (res) => {
        if (!res.result) {
          console.error('Failed to update position', res);
          // Revert if needed
        } else {
          // Refresh list to update counts/status
          this.loadCameras();
          this.loadMaps(); // To update counts
        }
      },
      error: (err) => console.error(err)
    });
  }

  onContextMenu(event: MouseEvent, cam: ICctvs) {
    event.preventDefault();
    this.cameraToRemove = cam;
    $('#deleteConfirmModal').modal('show');
  }

  closeDeleteModal() {
    $('#deleteConfirmModal').modal('hide');
    this.cameraToRemove = null;
  }

  confirmUnmap() {
    if (!this.cameraToRemove) return;

    const cam = this.cameraToRemove;
    const payload = {
      cctv_id: cam.id,
      map_id: null,
      x: null,
      y: null
    };

    this.http.put<any>(this.backendUrl + 'maps/cctv', payload).subscribe(res => {
      this.closeDeleteModal();
      this.loadCameras();
      this.loadMaps();
    });
  }


  onImageLoad(event: any) {
    // console.log('Image loaded, dimensions:', event.target.width, event.target.height);
  }

}
