import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthenticationRouting } from './authentication.routing';
import { SharedsModule } from '../shareds/shareds.module';
import { IndexComponent } from './components/index/index.component';
import { UsersComponent } from './components/users/users.component';
import { CctvComponent } from './components/cctv/cctv.component';
import { LogPingComponent } from './components/log-ping/log-ping.component';
import { DurableCreateComponent } from './components/durable-create/durable-create.component';
import { ReportComponent } from './components/report/report.component';
import { CheckListComponent } from './components/check-list/check-list.component';
import { MonitorComponent } from './components/monitor/monitor.component';



import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { HistoryComponent } from './components/history/history.component';

@NgModule({
  declarations: [
    DashboardComponent,
    IndexComponent,
    UsersComponent,
    CctvComponent,
    LogPingComponent,
    DurableCreateComponent,
    ReportComponent,
    CheckListComponent,
    MonitorComponent,
    HistoryComponent
  ],
  imports: [
    CommonModule,
    AuthenticationRouting,
    SharedsModule,
    TooltipModule.forRoot()
  ]
})
export class AuthenticationModule { }
