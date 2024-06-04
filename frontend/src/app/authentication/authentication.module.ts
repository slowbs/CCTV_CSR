import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthenticationRouting } from './authentication.routing';
import { SharedsModule } from '../shareds/shareds.module';
import { IndexComponent } from './components/index/index.component';
import { UsersComponent } from './components/users/users.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { CctvComponent } from './components/cctv/cctv.component';
import { LogPingComponent } from './components/log-ping/log-ping.component';



@NgModule({
  declarations: [
    DashboardComponent,
    IndexComponent,
    UsersComponent,
    UserCreateComponent,
    CctvComponent,
    LogPingComponent
  ],
  imports: [
    CommonModule,
    AuthenticationRouting,
    SharedsModule
  ]
})
export class AuthenticationModule { }
