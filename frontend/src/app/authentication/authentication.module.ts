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
import { DurableCreateComponent } from './components/durable-create/durable-create.component';
import { NetworkComponent } from './components/network/network.component';
import { ReportComponent } from './components/report/report.component';



@NgModule({
  declarations: [
    DashboardComponent,
    IndexComponent,
    UsersComponent,
    UserCreateComponent,
    CctvComponent,
    LogPingComponent,
    DurableCreateComponent,
    NetworkComponent,
    ReportComponent
  ],
  imports: [
    CommonModule,
    AuthenticationRouting,
    SharedsModule
  ]
})
export class AuthenticationModule { }
