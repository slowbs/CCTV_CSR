import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BsDropdownConfig, BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AuthNavbarComponent } from './components/auth-navbar/auth-navbar.component';
import { AuthSidebarComponent } from './components/auth-sidebar/auth-sidebar.component';
import { AuthContentComponent } from './components/auth-content/auth-content.component';
import { RouterModule } from '@angular/router';
import { CctvService } from './cctv.service';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { FormsModule } from '@angular/forms';
import localeTh from '@angular/common/locales/th'; // นำเข้า locale ภาษาไทย
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeTh); // ลงทะเบียน locale ภาษาไทย




@NgModule({
  declarations: [
    AuthNavbarComponent,
    AuthSidebarComponent,
    AuthContentComponent
  ],
  imports: [
    CommonModule,
    BsDropdownModule.forRoot(),
    RouterModule,
    PaginationModule.forRoot(),
    FormsModule
  ],
  exports: [
    AuthNavbarComponent,
    AuthSidebarComponent,
    AuthContentComponent,
    BsDropdownModule,
    PaginationModule,
    FormsModule
  ],
  providers: [
    {
      provide: BsDropdownConfig,
      useValue: { isAnimated: true, autoClose: true },
    },
    DatePipe,
    { provide: LOCALE_ID, useValue: 'th-TH' }, // ตั้งค่า locale เป็นภาษาไทย
    // CctvService
  ],
})
export class SharedsModule { }
