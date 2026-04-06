import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersService } from '../../services/members.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { FamilyMember, FamilyMemberCreate, FamilyMemberUpdate, BulkUploadResult } from '../../models';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './members-list.component.html'
})
export class MembersListComponent implements OnInit {
  private membersService = inject(MembersService);

  members: FamilyMember[] = [];
  allMembers: FamilyMember[] = [];
  loading = true;
  showModal = false;
  editingMember: FamilyMember | null = null;
  showDeleteConfirm = false;
  memberToDelete: FamilyMember | null = null;
  formError = '';

  filterHost: boolean | null = null;
  filterActive: boolean | null = null;

  showUploadModal = false;
  selectedFile: File | null = null;
  uploading = false;
  uploadError = '';
  uploadResult: BulkUploadResult | null = null;
  isDragging = false;

  form: FamilyMemberCreate & { clear_spouse?: boolean } = {
    name: '',
    email: '',
    phone: '',
    is_host: false,
    parent_id: null,
    spouse_id: null,
    is_active: true,
    notes: '',
  };

  ngOnInit(): void {
    this.loadMembers();
    this.loadAllMembers();
  }

  loadMembers(): void {
    this.loading = true;
    const filters: { is_host?: boolean; is_active?: boolean } = {};
    if (this.filterHost !== null) filters.is_host = this.filterHost;
    if (this.filterActive !== null) filters.is_active = this.filterActive;

    this.membersService.getMembers(filters).subscribe({
      next: (members) => {
        this.members = members;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadAllMembers(): void {
    this.membersService.getMembers().subscribe({
      next: (members) => { this.allMembers = members; }
    });
  }

  applyFilter(): void {
    this.loadMembers();
  }

  getParentName(parentId: number | null): string {
    if (!parentId) return '-';
    const parent = this.allMembers.find(m => m.id === parentId);
    return parent?.name ?? `#${parentId}`;
  }

  openCreateModal(): void {
    this.editingMember = null;
    this.formError = '';
    this.form = { name: '', email: '', phone: '', is_host: false, parent_id: null, spouse_id: null, is_active: true, notes: '' };
    this.showModal = true;
  }

  editMember(member: FamilyMember): void {
    this.editingMember = member;
    this.formError = '';
    this.form = {
      name: member.name,
      email: member.email,
      phone: member.phone,
      is_host: member.is_host,
      parent_id: member.parent_id,
      spouse_id: member.spouse_id,
      is_active: member.is_active,
      notes: member.notes,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingMember = null;
    this.formError = '';
  }

  saveMember(): void {
    this.formError = '';
    if (this.editingMember) {
      const update: FamilyMemberUpdate = { ...this.form };
      this.membersService.updateMember(this.editingMember.id, update).subscribe({
        next: () => { this.loadMembers(); this.loadAllMembers(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to update member.'; }
      });
    } else {
      this.membersService.createMember(this.form).subscribe({
        next: () => { this.loadMembers(); this.loadAllMembers(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to create member.'; }
      });
    }
  }

  confirmDelete(member: FamilyMember): void {
    this.memberToDelete = member;
    this.showDeleteConfirm = true;
  }

  deleteMember(): void {
    if (!this.memberToDelete) return;
    this.membersService.deleteMember(this.memberToDelete.id).subscribe({
      next: () => { this.loadMembers(); this.loadAllMembers(); this.showDeleteConfirm = false; this.memberToDelete = null; }
    });
  }

  downloadTemplate(): void {
    this.membersService.downloadTemplate();
  }

  openUploadModal(): void {
    this.showUploadModal = true;
    this.selectedFile = null;
    this.uploadError = '';
    this.uploadResult = null;
    this.isDragging = false;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    if (this.uploadResult?.created_count) {
      this.loadMembers();
      this.loadAllMembers();
    }
  }

  resetUpload(): void {
    this.selectedFile = null;
    this.uploadError = '';
    this.uploadResult = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.uploadError = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadError = '';
    }
  }

  submitUpload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.uploadError = '';
    this.membersService.bulkUpload(this.selectedFile).subscribe({
      next: (result) => {
        this.uploadResult = result;
        this.uploading = false;
      },
      error: (err) => {
        this.uploadError = err.error?.message || 'Upload failed. Please check your file and try again.';
        this.uploading = false;
      }
    });
  }
}
