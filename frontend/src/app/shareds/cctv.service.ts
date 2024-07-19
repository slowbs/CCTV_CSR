import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  // private backendURL = 'http://localhost/cctv_csr/backend/index.php/api/';
  private backendURL = '/backend/index.php/api/';

  public updateModel: ICctvs = Object.assign({})

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
  get_cctv() {
    return this.httpClient.get<ICctvs[]>(this.backendURL + 'cctvs');
  }

  // แก้ไขข้อมูลกล้อง
  put_items(id: any, value: ICctvs) {
    // return this.httpClient.put(this.backendURL + 'cctvs?id=' + id, value)
    // return this.httpClient.put(this.backendURL + 'cctvs', value, { params : { id : id}})
    // delete value.durable_name;
    // value.durable_name = '';
    return this.httpClient.put(this.backendURL + 'cctvs', value, { params: { id } })
  }

  post_items(value: ICctvs) {
    return this.httpClient.post(this.backendURL + 'cctvs', value)
  }

  // ดึงข้อมูลสถานะการใช้งานกล้องมาแสดง
  get_status() {
    return this.httpClient.get<IStatus[]>(this.backendURL + 'status');
  }

  // ดึงข้อมูลชั้นมาแสดง
  get_floor() {
    return this.httpClient.get<IFloor[]>(this.backendURL + 'floors');
  }


}

// ส่วนของ User
export interface IUsers {
  user_id?: string;
  user_name: string;
  name: string;
  password: string;
  c_password: string;
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

export interface IFloor {
  floor_id?: string;
  floor_name: string;
  floor_status?: string;
}