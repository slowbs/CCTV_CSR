import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CctvService {

  constructor(private httpClient: HttpClient) { }

  post_user(value: IUsers) {
    console.log(value)
  }
}

export interface IUsers {
  user_id?: string;
  user_name: string;
  name: string;
  password: string;
  c_password: string;
}
