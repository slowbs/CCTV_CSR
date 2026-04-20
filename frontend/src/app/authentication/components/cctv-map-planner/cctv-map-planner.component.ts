import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CctvService, ICctvs, IDraft } from '../../../shareds/cctv.service';

declare var $: any;

@Component({
  selector: 'app-cctv-map-planner',
  templateUrl: './cctv-map-planner.component.html',
  styleUrls: ['./cctv-map-planner.component.css']
})
export class CctvMapPlannerComponent implements OnInit {
  @ViewChild('mapImage') mapImage!: ElementRef<HTMLImageElement>;

  maps: any[] = [];
  selectedMap: any = null;
  cameras: ICctvs[] = [];
  drafts: IDraft[] = [];
  draftToRemove: IDraft | null = null;

  isDraftingMode: boolean = false;
  isLoading: boolean = false;

  // Toast notification
  toastMessage: string = '';
  toastType: 'error' | 'success' | 'warning' | 'info' = 'error';

  constructor(
    private cctvService: CctvService
  ) { }

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.toastMessage = message;
    this.toastType = type;
    // Auto-clear after 3s
    setTimeout(() => this.clearToast(), 3000);
  }

  clearToast() {
    this.toastMessage = '';
  }

  ngOnInit(): void {
    this.getMaps();
  }

  getMaps() {
    this.cctvService.get_maps().subscribe({
      next: (res) => {
        this.maps = res.result;
        if (this.maps.length > 0) {
          this.onSelectMap(this.maps[0]);
        }
      }
    });
  }

  onSelectMap(map: any) {
    this.selectedMap = map;
    this.loadData();
  }

  loadData() {
    if (!this.selectedMap) return;
    this.isLoading = true;

    // Load both real cameras and drafts
    this.cctvService.get_cctv('1').subscribe({
      next: (res: any) => {
        if (res && res.result) {
          const currentMapId = Number(this.selectedMap.id);
          // Filter and map real cameras
          this.cameras = res.result
            .filter((c: any) => c.map_id && Number(c.map_id) === currentMapId)
            .map((c: any) => ({
              ...c,
              map_x: c.map_x ? parseFloat(c.map_x) : null,
              map_y: c.map_y ? parseFloat(c.map_y) : null,
              map_rotation: c.map_rotation ? parseInt(c.map_rotation) : 0
            }));
        }

        // Load drafts
        this.cctvService.getDrafts(this.selectedMap.id).subscribe({
          next: (draftRes) => {
            if (draftRes && draftRes.result) {
              this.drafts = draftRes.result;
            }
            this.isLoading = false;
          },
          error: () => this.isLoading = false
        });
      },
      error: () => this.isLoading = false
    });
  }

  toggleDraftingMode() {
    this.isDraftingMode = !this.isDraftingMode;
    if (this.isDraftingMode) {
      this.showToast('เปิดโหมดปักจุดดราฟ: คลิกที่แผนที่เพื่อเพิ่มจุดใหม่', 'info');
    } else {
      this.showToast('ปิดโหมดปักจุดดราฟ', 'info');
    }
  }

  onMapClick(event: MouseEvent) {
    if (!this.isDraftingMode || !this.selectedMap) return;

    const rect = this.mapImage.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDraft: IDraft = {
      map_id: this.selectedMap.id,
      x: x.toFixed(2),
      y: y.toFixed(2),
      rotation: 0
    };

    this.cctvService.addDraft(newDraft).subscribe({
      next: (res) => {
        newDraft.id = res.id;
        this.drafts.push(newDraft);
        this.showToast('เพิ่มจุดดราฟเรียบร้อย', 'success');
      }
    });
  }

  onDragEnd(event: DragEvent, draft: IDraft) {
    const rect = this.mapImage.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    draft.x = x.toFixed(2);
    draft.y = y.toFixed(2);

    this.cctvService.updateDraft(draft.id, { x: draft.x, y: draft.y }).subscribe();
  }

  onWheel(event: WheelEvent, draft: IDraft) {
    if (!event.shiftKey) return;
    event.preventDefault();

    const delta = event.deltaY > 0 ? 15 : -15;
    draft.rotation = ((draft.rotation || 0) + delta) % 360;

    this.cctvService.updateDraft(draft.id, { rotation: draft.rotation } as any).subscribe();
  }

  onNoteChange(draft: IDraft) {
    this.cctvService.updateDraft(draft.id, { note: draft.note }).subscribe({
      next: () => this.showToast('บันทึกโน๊ตเรียบร้อย', 'success')
    });
  }

  deleteDraft(draft: IDraft) {
    this.draftToRemove = draft;
    $('#deleteDraftModal').modal('show');
  }

  closeDeleteModal() {
    $('#deleteDraftModal').modal('hide');
    this.draftToRemove = null;
  }

  confirmDeleteDraft() {
    if (!this.draftToRemove) return;
    const id = this.draftToRemove.id;
    this.cctvService.deleteDraft(id).subscribe({
      next: () => {
        this.drafts = this.drafts.filter(d => d.id !== id);
        this.closeDeleteModal();
        this.showToast('ลบจุดดราฟเรียบร้อย', 'warning');
      }
    });
  }

  onImageLoad(event: any) {
    // Optional: handle image load logic
  }
}
