import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Subject, of, tap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  private backendURL: string;
  private userProfileCache: ISession.Response | null = null; // Cache for user profile

  public updateModel: ICctvs = Object.assign({})
  public updateModelUser: IUsers = Object.assign({})
  public updateModelLogping: ILogPing = Object.assign({})

  private refreshNavbarSubject = new Subject<void>();
  refreshNavbar$ = this.refreshNavbarSubject.asObservable();

  constructor(private httpClient: HttpClient) {
    // กำหนด backendURL ตามเงื่อนไข
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.backendURL = environment.API_LOCALHOST;
    } else if (window.location.hostname.startsWith('192.168')) {
      this.backendURL = environment.API_LOCALIP;
    } else {
      this.backendURL = environment.API_NGROK;
    }
  }

  // Service ฝั่งข้อมูลผู้ใช้งาน
  // เพิ่มข้อมูลผู้ใช้งาน
  post_user(value: IUsers) {
    return this.httpClient.post(this.backendURL + 'users', value);
  }

  // Login
  // ส่งข้อมูลไป Login
  post_login(value: ILogin) {
    this.userProfileCache = null; // Clear cache on login attempt
    return this.httpClient.post(this.backendURL + 'login', value);
  }

  // Logout
  post_logout() {
    this.userProfileCache = null; // Clear cache on logout
    return this.httpClient.post(this.backendURL + 'logout', null)
  }

  //ดึงข้อมูลมาแสดง Profile
  get_profile() {
    if (this.userProfileCache) {
      return of(this.userProfileCache);
    }
    return this.httpClient.get<ISession.Response>(this.backendURL + 'login').pipe(
      tap(response => {
        if (response && response.session) {
          this.userProfileCache = response;
        }
      })
    );
  }

  // Service ฝั่ง กล้อง CCTV
  // ดึงข้อมูลกล้องมาแสดง
  get_cctv(type?: string) {
    const params = type ? { params: { type } } : {};
    return this.httpClient.get<ICctvs[]>(this.backendURL + 'cctvs', params);
  }

  // แก้ไขข้อมูลครุภัณฑ์
  put_cctv(id: any, value: ICctvs) {
    // return this.httpClient.put(this.backendURL + 'cctvs?id=' + id, value)
    // return this.httpClient.put(this.backendURL + 'cctvs', value, { params : { id : id}})
    // delete value.durable_name;
    // value.durable_name = '';
    return this.httpClient.put(this.backendURL + 'cctvs', value, { params: { id } })
  }

  // เพิ่มข้อมูลครุภัณฑ์
  post_items(value: ICctvs) {
    return this.httpClient.post(this.backendURL + 'cctvs', value)
  }

  // ดึงข้อมูลสถานะการใช้งานครุภัณฑ์มาแสดง
  get_status() {
    return this.httpClient.get<IStatus[]>(this.backendURL + 'status');
  }

  // ดึงข้อมูลชั้นมาแสดง
  get_floor() {
    return this.httpClient.get<IFloor[]>(this.backendURL + 'floors');
  }

  // ดึงข้อมูลประเภทครุภัณฑ์มาแสดง
  get_type() {
    return this.httpClient.get<IType[]>(this.backendURL + 'types');
  }

  // แสดงข้อมูล Log
  get_logping(id: any) {
    return this.httpClient.get<ILogPing[]>(this.backendURL + 'log_ping', { params: { id: id } });
  }

  // แสดงข้อมูล Log
  put_logping(log_id: any, value: ILogPing) {
    return this.httpClient.put(this.backendURL + 'log_ping', value, { params: { log_id: log_id } })
  }

  // ดึงข้อมูลจำนวนนับสถานะอุปกรณ์มาแสดงในหน้า dashboard
  get_countping() {
    return this.httpClient.get<ICountPing[]>(this.backendURL + 'dashboard');
  }

  // แจ้งเตือน
  get_notify() {
    return this.httpClient.get<any>(this.backendURL + 'notify');
  }

  // ดึงข้อมูล Audit Logs
  get_audit_logs(id?: number) {
    let params: any = {};
    if (id) {
      params.id = id;
    }
    return this.httpClient.get<any>(this.backendURL + 'audit_logs', { params: params });
  }

  // เพิ่มฟังก์ชันดึงข้อมูลการเปลี่ยนแปลงสถานะล่าสุดมาแสดงในหน้า dashboard
  getRecentStatusChanges() {
    return this.httpClient.get<ILogPing[]>(this.backendURL + 'dashboard'); // สมมุติว่า endpoint นี้คือ API ที่ดึงข้อมูลสถานะล่าสุด
  }

  // ดึงข้อมูลผู้ใช้งานมาแสดง
  get_users() {
    return this.httpClient.get<IUsers[]>(this.backendURL + 'users');
  }

  // แก้ไขข้อมูลผู้ใช้งาน
  put_user(user_id: any, value: IUsers) {
    return this.httpClient.put(this.backendURL + 'users', value, { params: { user_id } })
  }

  //ดึงข้อมูลมาแสดงรายงาน
  // ใน CctvService
  get_report(id: any, startDate?: string, endDate?: string) {
    // เพิ่ม parameter startDate และ endDate เข้าไปใน request params
    let params: any = { id: id };
    if (startDate) { params.startDate = startDate; }
    if (endDate) { params.endDate = endDate; }

    return this.httpClient.get<IReport.Report>(
      this.backendURL + 'report',
      { params: params }
    );
  }

  //ดึงข้อมูลรายการ checklist
  getChecklistItems(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.backendURL + 'checklist-items'); //ลบ .php ออก
  }

  //ดึงข้อมูล log checklist ตามเดือน
  getChecklistLogs(month: string): Observable<any[]> {
    return this.httpClient.get<any[]>(this.backendURL + `checklist-logs?month=${month}`); // ลบ .php ออก
  }

  //บันทึก checklist
  saveChecklistLogs(data: any): Observable<any> {
    return this.httpClient.post(this.backendURL + 'checklist-logs', data); // ลบ .php ออก
  }

  // ฟังก์ชันสำหรับส่งสัญญาณให้ Navbar Refresh
  notifyNavbarToRefresh() {
    this.refreshNavbarSubject.next();
  }

}

// ส่วนของ User
export interface IUsers {
  user_id?: string;
  user_name: string;
  name: string;
  password: string;
  c_password: string;
  status?: string;
}

export interface ILogin {
  user_name: string;
  password: string;
  remember: boolean;
}

export namespace ISession {

  export interface Response {
    message: string;
    session: Session;
  }

  export interface Session {
    user_id?: string;
    user_name: string;
    name: string;
    password: string;
    c_password: string;
  }
}

// ส่วนของรายการครุภัณฑ์

export interface ICctvs {
  id?: string;
  durable_no: string;
  durable_name?: string;
  brand?: string;
  model?: string;
  location?: string;
  monitor?: string;
  floor?: string;
  floor_id?: string;
  floor_order?: string;
  status?: string;
  status_id?: string;
  type: string;
  ip?: string;
  notify?: string;
  ping?: string;
  date_updated?: string;
  completed?: boolean;
  maintenance_mode?: string | number;
}

export interface IStatus {
  status_id?: string;
  status_name: string;
}

export interface IType {
  type_id?: string;
  type_name: string;
}

export interface IFloor {
  floor_id?: string;
  floor_name: string;
  floor_status?: string;
}

export interface ILogPing {
  log_id: string
  cctv_id: string
  ping_checked: string
  date_created: string
  durable_no: string
  durable_name: string
  floor_name: string
  location: string
  monitor: string
  ip: string
  duration: string
  type: string
  comment: string
}

export interface ICountPing {
  type: string;
  online_count: string;
  offline_count: string;
  maintenance_count: string;
}

export interface IAuditLog {
  id: number;
  cctv_id: number;
  old_ip: string;
  new_ip: string;
  old_location: string;
  new_location: string;
  old_monitor: string;
  new_monitor: string;
  old_status: string;
  new_status: string;
  old_floor: string;
  new_floor: string;
  updated_at: string;
  durable_name?: string;
  durable_no?: string;
}


export namespace IReport {

  export interface Report {
    durable_no: string
    durable_name: string
    location: string
    monitor?: string
    floor: string
    floor_order?: string
    status: string
    status_id: string
    ping: string
    logs: Log[]
  }

  export interface Log {
    offline: string
    online: string
    duration?: string | null
    comment?: string | null
  }
}
