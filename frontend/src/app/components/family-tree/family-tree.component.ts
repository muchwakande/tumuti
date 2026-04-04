import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { MembersService } from '../../services/members.service';
import { FamilyMemberTree } from '../../models';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node">
      <div class="flex items-center gap-2">
        <!-- Expand/collapse toggle -->
        @if (member.children.length > 0) {
          <button
            class="w-5 h-5 rounded flex items-center justify-center bg-primary-100 text-primary-600 flex-shrink-0 text-xs font-bold"
            (click)="toggle()"
          >{{ collapsed ? '+' : '−' }}</button>
        } @else {
          <span class="w-5 h-5 flex-shrink-0"></span>
        }

        <!-- Member card -->
        <div
          [class]="'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-default ' +
            (member.is_host ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white')"
        >
          <div
            [class]="'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ' +
              (member.is_host ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600')"
          >{{ member.name.charAt(0).toUpperCase() }}</div>
          <div>
            <p class="text-sm font-semibold text-gray-900 leading-tight">{{ member.name }}</p>
            <p class="text-xs text-gray-500">{{ member.phone }}</p>
          </div>
          @if (member.is_host) {
            <span class="ml-1 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full font-medium">Host</span>
          }
          @if (!member.is_active) {
            <span class="ml-1 px-2 py-0.5 text-xs bg-gray-400 text-white rounded-full font-medium">Inactive</span>
          }
        </div>

        <!-- Spouse -->
        @if (member.spouse_name) {
          <span class="text-rose-400 font-bold text-base select-none">♥</span>
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-rose-200 text-rose-700">
              {{ member.spouse_name.charAt(0).toUpperCase() }}
            </div>
            <p class="text-sm font-semibold text-gray-900 leading-tight">{{ member.spouse_name }}</p>
          </div>
        }
      </div>

      @if (!collapsed && member.children.length > 0) {
        <div class="ml-6 mt-1 pl-4 border-l-2 border-gray-200 space-y-1">
          @for (child of member.children; track child.id) {
            <app-tree-node [member]="child"></app-tree-node>
          }
        </div>
      }
    </div>
  `
})
export class TreeNodeComponent {
  @Input() member!: FamilyMemberTree;
  collapsed = false;

  toggle(): void {
    if (this.member.children.length > 0) {
      this.collapsed = !this.collapsed;
    }
  }
}

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, TreeNodeComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Family Tree</h1>
          <p class="text-gray-500 mt-1">Visual hierarchy of the Kingori family</p>
        </div>
        <div class="flex gap-3">
          <button (click)="expandAll()" class="btn-secondary text-sm">Expand All</button>
          <button (click)="collapseAll()" class="btn-secondary text-sm">Collapse All</button>
        </div>
      </div>

      <div class="mb-4 flex items-center gap-4 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">K</div>
          <span>Host member</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">K</div>
          <span>Regular member</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 text-xs bg-gray-400 text-white rounded-full">Inactive</span>
          <span>Inactive member</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-rose-400 font-bold">♥</span>
          <div class="px-2 py-0.5 text-xs rounded border border-rose-200 bg-rose-50 text-rose-700">Spouse</div>
        </div>
      </div>

      @if (loading) {
        <app-loading-spinner text="Loading family tree..."></app-loading-spinner>
      } @else if (tree.length === 0) {
        <div class="card text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <p class="text-gray-500 text-lg">No family members yet.</p>
          <p class="text-gray-400 text-sm mt-1">Add members in the Members section to build the family tree.</p>
        </div>
      } @else {
        <div class="card overflow-auto">
          <div class="family-tree space-y-2">
            @for (root of tree; track root.id) {
              <app-tree-node [member]="root"></app-tree-node>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class FamilyTreeComponent implements OnInit {
  private membersService = inject(MembersService);

  tree: FamilyMemberTree[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading = true;
    this.membersService.getFamilyTree().subscribe({
      next: (tree) => {
        this.tree = tree;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  expandAll(): void {
    this.loadTree();
  }

  collapseAll(): void {
    this.loadTree();
  }
}
