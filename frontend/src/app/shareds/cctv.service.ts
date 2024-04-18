import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  private backendURL = 'http://localhost/cctv_csr/backend/index.php/api/';

  constructor(private httpClient: HttpClient) { }

  // ข้อมูลผู้ใช้งาน
  // เพิ่มข้อมูลผู้ใช้งาน
  post_user(value: IUsers) {
    return this.httpClient.post(this.backendURL + 'users', value);
    // console.log(value)
  }
}

export interface IUsers {
  user_id?: string;
  user_name: string;
  name: string;
  password: string;
  c_password: string;
}