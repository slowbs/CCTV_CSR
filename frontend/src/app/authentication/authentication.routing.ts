import { Routes, RouterModule } from "@angular/router";
import { AuthenticationURL } from "./authentication.url";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { IndexComponent } from "./components/index/index.component";

const RouteLists: Routes = [
    { path: '', redirectTo: AuthenticationURL.Dashboard, pathMatch: 'full' },
    { path: AuthenticationURL.Dashboard, component: DashboardComponent },
    { path: AuthenticationURL.Index, component: IndexComponent}

];

export const AuthenticationRouting = RouterModule.forChild(RouteLists);
