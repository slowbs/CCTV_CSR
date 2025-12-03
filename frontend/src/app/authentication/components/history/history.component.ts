import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppURL } from '../../../app.url';
import { AuthenticationURL } from '../../authentication.url';
import { CctvService, IAuditLog } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  AppUrl = AppURL;
  AuthUrl = AuthenticationURL;
  logs: IAuditLog[] = [];
  filteredLogs: IAuditLog[] = [];
  isLoading = true;
  cctvId: number | null = null;
  searchText: string = '';

  constructor(
    private route: ActivatedRoute,
    private cctvService: CctvService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.cctvId = +params['id'];
        this.loadLogs(this.cctvId);
      } else {
        this.cctvId = null;
        this.loadLogs();
      }
    });
  }

  loadLogs(id: number | null = null): void {
    this.isLoading = true;
    this.cctvService.get_audit_logs(id || undefined).subscribe(
      res => {
        this.logs = res.result;
        this.filterLogs();
        this.isLoading = false;
      },
      err => {
        console.error('Error loading logs', err);
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
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
