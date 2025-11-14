import { Routes } from '@angular/router';
import { LegalNotice } from './landing-page/legal-notice/legal-notice';
import { Login } from './landing-page/login/login';
import { PrivacyPolicy } from './landing-page/privacy-policy/privacy-policy';
import { Signup } from './landing-page/signup/signup';
import { LandingPage } from './landing-page/landing-page';
import { ResetPassword } from './landing-page/reset-password/reset-password';
import { Main } from './main/main';
import { DetailPage } from './detail-page/detail-page'; 

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
    children: [
      { path: '', component: Login },
      { path: 'signup', component: Signup },
      { path: 'reset-password', component: ResetPassword },
      { path: 'detail/:id', component: DetailPage },
    ],
  },
  {
    path: 'main',
    component: Main,
    children: [
      { path: '', component: Main },
    ],
  }
  ,
  {
    path: 'legal-notice',
    component: LegalNotice,
     children: [
      { path: '', component: LegalNotice },
    ],
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicy,
    children: [
      { path: '', component: PrivacyPolicy },
    ],
  }
];
