import { Routes, RouterModule } from "@angular/router";
import { AuthenticationURL } from "./authentication.url";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { IndexComponent } from "./components/index/index.component";
import { UsersComponent } from "./components/users/users.component";
import { UserCreateComponent } from "./components/user-create/user-create.component";
import { CctvComponent } from "./components/cctv/cctv.component";
import { LogPingComponent } from "./components/log-ping/log-ping.component";
import { DurableCreateComponent } from "./components/durable-create/durable-create.component";
import { NetworkComponent } from "./components/network/network.component";
import { ReportComponent } from "./components/report/report.component";
import { CheckListComponent } from "./components/check-list/check-list.component";

const RouteLists: Routes = [
    { path: '', redirectTo: AuthenticationURL.Index, pathMatch: 'full' },
    { path: AuthenticationURL.Dashboard, component: DashboardComponent },
    { path: AuthenticationURL.Index, component: IndexComponent },
    { path: AuthenticationURL.User, component: UsersComponent },
    { path: AuthenticationURL.Create_User, component: UserCreateComponent },
    { path: `${AuthenticationURL.Cctv}/:type`, component: CctvComponent },
    { path: `${AuthenticationURL.Log_Ping}/:id`, component: LogPingComponent },
    { path: `${AuthenticationURL.Report}/:id`, component: ReportComponent },
    { path: AuthenticationURL.Create_Durable, component: DurableCreateComponent },
    { path: AuthenticationURL.Network, component: NetworkComponent },
    { path: AuthenticationURL.Check_List, component: CheckListComponent }

];

export const AuthenticationRouting = RouterModule.forChild(RouteLists);
