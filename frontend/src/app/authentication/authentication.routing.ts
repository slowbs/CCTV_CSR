import { Routes, RouterModule } from "@angular/router";
import { AuthenticationURL } from "./authentication.url";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { IndexComponent } from "./components/index/index.component";
import { UsersComponent } from "./components/users/users.component";
import { CctvComponent } from "./components/cctv/cctv.component";
import { LogPingComponent } from "./components/log-ping/log-ping.component";
import { DurableCreateComponent } from "./components/durable-create/durable-create.component";
import { ReportComponent } from "./components/report/report.component";
import { CheckListComponent } from "./components/check-list/check-list.component";
import { MonitorComponent } from './components/monitor/monitor.component';
import { HistoryComponent } from './components/history/history.component';
import { MonitorCctvComponent } from "./components/monitor-cctv/monitor-cctv.component";
import { CctvMapManagerComponent } from "./components/cctv-map-manager/cctv-map-manager.component";
import { AuthGuard } from "../guards/auth.guard";

const RouteLists: Routes = [
    { path: '', redirectTo: AuthenticationURL.Index, pathMatch: 'full' },
    { path: AuthenticationURL.Dashboard, component: DashboardComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Index, component: IndexComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.User, component: UsersComponent, canActivate: [AuthGuard] },
    { path: `${AuthenticationURL.Cctv}/:type`, component: CctvComponent, canActivate: [AuthGuard] },
    { path: `${AuthenticationURL.Log_Ping}/:id`, component: LogPingComponent, canActivate: [AuthGuard] },
    { path: `${AuthenticationURL.Report}/:id`, component: ReportComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Create_Durable, component: DurableCreateComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Check_List, component: CheckListComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Monitor, component: MonitorComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Monitor_CCTV, component: MonitorCctvComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.Map_Manager, component: CctvMapManagerComponent, canActivate: [AuthGuard] },
    { path: AuthenticationURL.History, component: HistoryComponent, canActivate: [AuthGuard] }
];

export const AuthenticationRouting = RouterModule.forChild(RouteLists);
