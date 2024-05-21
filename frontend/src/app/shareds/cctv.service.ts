import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  // private backendURL = 'http://localhost/cctv_csr/backend/index.php/api/';
  private backendURL = '/backend/index.php/api/';

  constructor(private httpClient: HttpClient) { }

  // ข้อมูลผู้ใช้งาน
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

}

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
    user_name: string
    password: string
    remember: boolean
  }

}