import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() type: 'error' | 'success' | 'warning' | 'info' = 'error';
  @Input() autoHide: boolean = true;
  @Input() duration: number = 4000;
  @Output() closed = new EventEmitter<void>();

  private timeoutId: any;

  ngOnChanges() {
    if (this.message && this.autoHide) {
      this.clearTimeout();
      this.timeoutId = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  close() {
    this.message = '';
    this.closed.emit();
    this.clearTimeout();
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy() {
    this.clearTimeout();
  }

  get iconClass(): string {
    switch (this.type) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-circle-fill';
      case 'info': return 'bi-info-circle-fill';
      case 'error':
      default: return 'bi-exclamation-triangle-fill';
    }
  }

  get bgClass(): string {
    switch (this.type) {
      case 'success': return 'text-bg-success';
      case 'warning': return 'text-bg-warning';
      case 'info': return 'text-bg-info';
      case 'error':
      default: return 'text-bg-danger';
    }
  }
}
