// app.routes.ts
import { Routes } from '@angular/router';
import { LegalNotice } from './landing-page/legal-notice/legal-notice';
import { Login } from './landing-page/login/login';
import { PrivacyPolicy } from './landing-page/privacy-policy/privacy-policy';
import { Signup } from './landing-page/signup/signup';
import { LandingPage } from './landing-page/landing-page';
import { ResetPassword } from './landing-page/reset-password/reset-password';
import { Main } from './main/main';
import { DetailPage } from './detail-page/detail-page';
import { ChooseAvatar } from './landing-page/choose-avatar/choose-avatar'; 
import { ChannelMessages } from './main/channel-messages/channel-messages';
import { ChatDirectMessage } from './main/menu/chat-direct-message/chat-direct-message';
import { ChatDirectYou } from './main/menu/chat-direct-you/chat-direct-you';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
    children: [
      { path: '', component: Login },
      { path: 'signup', component: Signup },
      { path: 'choose-avatar', component: ChooseAvatar },
      { path: 'reset-password', component: ResetPassword },
      { path: 'detail/:id', component: DetailPage },
    ],
  },
  {
    path: 'main',
    component: Main,
    children: [
      { path: '', redirectTo: 'channels', pathMatch: 'full' },
      { path: 'channels', component: ChannelMessages },
      { path: 'direct-message/:id', component: ChatDirectMessage },
      { path: 'direct-you', component: ChatDirectYou }
    ],
  },
  {
    path: 'legal-notice',
    component: LegalNotice,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicy,
  }
];