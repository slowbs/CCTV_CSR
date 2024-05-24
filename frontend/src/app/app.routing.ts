import { Routes, RouterModule } from "@angular/router";
import { AppURL } from "./app.url";
import { LoginComponent } from "./components/login/login.component";
import { RegisterComponent } from "./components/register/register.component";

const RouteLists: Routes = [
    { path: '', redirectTo: AppURL.Login, pathMatch: 'full' },
    { path: AppURL.Login, component: LoginComponent },
    { path: AppURL.Register, component: RegisterComponent },
    // { path: AppURL.Authen, loadChildren: 'authentication/authentication.module#AuthenticationModule'}
    { path: AppURL.Authen, loadChildren: () => import('./authentication/authentication.module').then(x => x.AuthenticationModule)},
    
];

export const AppRouting = RouterModule.forRoot(RouteLists);
