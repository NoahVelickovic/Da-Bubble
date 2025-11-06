import { Routes } from '@angular/router';
import { LandingPage } from '../app/landing-page/landing-page';
import { App } from '../app/app';



export const routes: Routes = [
    { path: 'landing', component: LandingPage },
        { path: 'app', component: App }

];
