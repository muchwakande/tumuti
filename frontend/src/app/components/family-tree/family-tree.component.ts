import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { MembersService } from '../../services/members.service';
import { FamilyMemberTree } from '../../models';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tree-node.component.html'
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
  templateUrl: './family-tree.component.html'
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
