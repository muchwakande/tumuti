import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-sidebar></app-sidebar>
      <main class="ml-64 p-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {}
