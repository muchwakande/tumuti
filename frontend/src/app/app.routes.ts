import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'family-tree',
        loadComponent: () => import('./components/family-tree/family-tree.component').then(m => m.FamilyTreeComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./components/members/members-list.component').then(m => m.MembersListComponent)
      },
      {
        path: 'meetings',
        loadComponent: () => import('./components/meetings/meetings-list.component').then(m => m.MeetingsListComponent)
      },
      {
        path: 'meetings/:id',
        loadComponent: () => import('./components/meetings/meeting-detail.component').then(m => m.MeetingDetailComponent)
      },
      {
        path: 'meetings/:id/minutes',
        loadComponent: () => import('./components/meetings/meeting-minutes.component').then(m => m.MeetingMinutesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./components/contributions/contributions-list.component').then(m => m.ContributionsListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
