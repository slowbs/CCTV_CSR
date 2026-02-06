import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import { CctvService, IAuditLog } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  logs: IAuditLog[] = [];
  filteredLogs: IAuditLog[] = [];
  isLoading = true;
  cctvId: number | null = null;
  searchText: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  pages: number[] = [];

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

  constructor(
    private route: ActivatedRoute,
    private cctvService: CctvService,
    private datePipe: DatePipe
  ) { }

  // Format date to Thai Buddhist Era (dd/mm/yyyy hh.mm)
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

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['id']) {
          this.cctvId = +params['id'];
        } else {
          this.cctvId = null;
        }
        this.currentPage = 1;
        this.loadLogs();
      });
  }

  loadLogs(): void {
    this.isLoading = true;
    this.cctvService.get_audit_logs(this.cctvId || undefined, this.currentPage, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.logs = res.result || [];
          this.totalItems = res.total || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.generatePages();
          this.filterLogs();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading logs', err);
          this.logs = [];
          this.filteredLogs = [];
          this.isLoading = false;
          this.showToast('ไม่สามารถโหลดประวัติการเปลี่ยนแปลงได้', 'error');
        }
      });
  }

  generatePages(): void {
    const maxPagesToShow = 5;
    this.pages = [];

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        this.pages.push(i);
      }
    } else {
      // Always show first page
      this.pages.push(1);

      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);

      if (this.currentPage <= 3) {
        endPage = 4;
      }
      if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - 3;
      }

      if (startPage > 2) {
        this.pages.push(-1); // -1 indicates ellipsis
      }

      for (let i = startPage; i <= endPage; i++) {
        this.pages.push(i);
      }

      if (endPage < this.totalPages - 1) {
        this.pages.push(-1);
      }

      // Always show last page
      this.pages.push(this.totalPages);
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  onSearch(): void {
    // Client-side search on current page (limitation)
    this.filterLogs();
  }

  filterLogs(): void {
    if (!this.searchText) {
      this.filteredLogs = this.logs;
      return;
    }

    const lowerSearch = this.searchText.toLowerCase();
    this.filteredLogs = this.logs.filter(log => {
      return (
        (log.durable_name && log.durable_name.toLowerCase().includes(lowerSearch)) ||
        (log.durable_no && log.durable_no.toLowerCase().includes(lowerSearch)) ||
        (log.old_ip && log.old_ip.toLowerCase().includes(lowerSearch)) ||
        (log.new_ip && log.new_ip.toLowerCase().includes(lowerSearch)) ||
        (log.old_location && log.old_location.toLowerCase().includes(lowerSearch)) ||
        (log.new_location && log.new_location.toLowerCase().includes(lowerSearch))
      );
    });
  }
}
