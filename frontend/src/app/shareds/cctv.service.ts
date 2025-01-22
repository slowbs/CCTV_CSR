import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  // private backendURL = 'http://localhost/cctv_csr/backend/index.php/api/';
  private backendURL = '/backend/index.php/api/';

  public updateModel: ICctvs = Object.assign({})
  public updateModelUser: IUsers = Object.assign({})

  constructor(private httpClient: HttpClient) { }


  // Service ฝั่งข้อมูลผู้ใช้งาน
  // เพิ่มข้อมูลผู้ใช้งาน
  post_user(value: IUsers) {
    return this.httpClient.post(this.backendURL + 'users', value);
  }

  // Login
  // ส่งข้อมูลไป Login
  post_login(value: ILogin) {
    return this.httpClient.post(this.backendURL + 'login', value);
  }

  // Logout
  post_logout() {
    return this.httpClient.post(this.backendURL + 'logout', null)
  }

  //ดึงข้อมูลมาแสดง Profile
  get_profile() {
    return this.httpClient.get<ISession.Response>(this.backendURL + 'login');
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

  // ดึงข้อมูลครุภัณฑ์ที่ไม่ใช่กล้องมาแสดง
  get_network() {
    return this.httpClient.get<ICctvs[]>(this.backendURL + 'networks');
  }

  get_logping(id: any) {
    return this.httpClient.get<ILogPing[]>(this.backendURL + 'log_ping', { params: { id: id } });
  }

  // ดึงข้อมูลจำนวนนับสถานะอุปกรณ์มาแสดงในหน้า dashboard
  get_countping() {
    return this.httpClient.get<ICountPing[]>(this.backendURL + 'dashboard');
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
  get_report(id: any) {
    return this.httpClient.get<IReport.Report>(this.backendURL + 'report', { params: { id: id } });
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
  status?: string;
  status_id?: string;
  type: string;
  ip?: string;
  notify?: string;
  ping?: string;
  date_updated?: string;
  completed?: boolean;
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
}

export interface ICountPing {
  type: string;
  online_count: string;
  offline_count: string;
}


export namespace IReport {

  export interface Report {
    durable_no: string
    durable_name: string
    location: string
    floor: string
    status: string
    ping: string
    logs: Log[]
  }

  export interface Log {
    offline: string
    online: string
  }
}