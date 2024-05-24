import { Routes, RouterModule } from "@angular/router";
import { AuthenticationURL } from "./authentication.url";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { IndexComponent } from "./components/index/index.component";
import { UsersComponent } from "./components/users/users.component";
import { UserCreateComponent } from "./components/user-create/user-create.component";
import { CctvComponent } from "./components/cctv/cctv.component";

const RouteLists: Routes = [
    { path: '', redirectTo: AuthenticationURL.Index, pathMatch: 'full' },
    { path: AuthenticationURL.Dashboard, component: DashboardComponent },
    { path: AuthenticationURL.Index, component: IndexComponent },
    { path: AuthenticationURL.User, component: UsersComponent },
    { path: AuthenticationURL.Create_User, component: UserCreateComponent },
    { path: AuthenticationURL.Cctv, component: CctvComponent}

];

export const AuthenticationRouting = RouterModule.forChild(RouteLists);
