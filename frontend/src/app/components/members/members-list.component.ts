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
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Members</h1>
          <p class="text-gray-500 mt-1">Manage family members</p>
        </div>
        <div class="flex gap-2">
          <button (click)="downloadTemplate()" class="btn-secondary">↓ Template</button>
          <button (click)="openUploadModal()" class="btn-secondary">↑ Upload Spreadsheet</button>
          <button (click)="openCreateModal()" class="btn-primary">+ Add Member</button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="card mb-4 flex gap-4 items-center flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600">Filter:</label>
          <select [(ngModel)]="filterHost" (ngModelChange)="applyFilter()" class="input-field py-1 text-sm w-36">
            <option [ngValue]="null">All members</option>
            <option [ngValue]="true">Hosts only</option>
            <option [ngValue]="false">Non-hosts</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <select [(ngModel)]="filterActive" (ngModelChange)="applyFilter()" class="input-field py-1 text-sm w-36">
            <option [ngValue]="null">All status</option>
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
          </select>
        </div>
        <span class="text-sm text-gray-500 ml-auto">{{ members.length }} member(s)</span>
      </div>

      @if (loading) {
        <app-loading-spinner text="Loading members..."></app-loading-spinner>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="table-header">
                <tr>
                  <th class="px-6 py-3">Name</th>
                  <th class="px-6 py-3">Phone</th>
                  <th class="px-6 py-3">Spouse</th>
                  <th class="px-6 py-3">Host</th>
                  <th class="px-6 py-3">Parent</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (member of members; track member.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="table-cell">
                      <div class="flex items-center gap-3">
                        <div [class]="'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ' + (member.is_host ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600')">
                          {{ member.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-medium text-gray-900">{{ member.name }}</span>
                      </div>
                    </td>
                    <td class="table-cell text-gray-600">{{ member.phone }}</td>
                    <td class="table-cell text-gray-600">
                      @if (member.spouse_name) {
                        <span class="flex items-center gap-1">
                          <span class="text-rose-400">♥</span> {{ member.spouse_name }}
                        </span>
                      } @else { - }
                    </td>
                    <td class="table-cell">
                      @if (member.is_host) {
                        <span class="status-badge bg-primary-100 text-primary-700">Host</span>
                      } @else {
                        <span class="status-badge bg-gray-100 text-gray-600">Member</span>
                      }
                    </td>
                    <td class="table-cell text-gray-600">{{ getParentName(member.parent_id) }}</td>
                    <td class="table-cell">
                      <span [class]="'status-badge ' + (member.is_active ? 'status-completed' : 'status-rejected')">
                        {{ member.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="table-cell">
                      <div class="flex gap-2">
                        <button (click)="editMember(member)" class="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                        <button (click)="confirmDelete(member)" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-10 text-center text-gray-500">No members found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closeModal()"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 class="text-lg font-semibold mb-4">{{ editingMember ? 'Edit Member' : 'Add Member' }}</h3>
              @if (formError) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ formError }}</div>
              }
              <form (ngSubmit)="saveMember()" #memberForm="ngForm">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" [(ngModel)]="form.name" name="name" required class="input-field" placeholder="Full name" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" [(ngModel)]="form.email" name="email" class="input-field" placeholder="email@example.com (optional)" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="tel" [(ngModel)]="form.phone" name="phone" required class="input-field" placeholder="+254 700 000 000" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                    <select [(ngModel)]="form.parent_id" name="parent_id" class="input-field">
                      <option [ngValue]="null">No parent (root member)</option>
                      @for (m of allMembers; track m.id) {
                        @if (!editingMember || m.id !== editingMember.id) {
                          <option [ngValue]="m.id">{{ m.name }}</option>
                        }
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Spouse</label>
                    <div class="flex gap-2 items-center">
                      <select [(ngModel)]="form.spouse_id" name="spouse_id" class="input-field">
                        <option [ngValue]="null">No spouse</option>
                        @for (m of allMembers; track m.id) {
                          @if (!editingMember || m.id !== editingMember.id) {
                            <option [ngValue]="m.id">{{ m.name }}</option>
                          }
                        }
                      </select>
                      @if (editingMember?.spouse_id) {
                        <button type="button" (click)="form.spouse_id = null; form.clear_spouse = true" class="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">Remove</button>
                      }
                    </div>
                  </div>
                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [(ngModel)]="form.is_host" name="is_host" class="h-4 w-4 text-primary-600 rounded border-gray-300" />
                      <span class="text-sm text-gray-700">Is Host (opts in to contribute)</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [(ngModel)]="form.is_active" name="is_active" class="h-4 w-4 text-primary-600 rounded border-gray-300" />
                      <span class="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea [(ngModel)]="form.notes" name="notes" rows="2" class="input-field" placeholder="Optional notes..."></textarea>
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="!memberForm.valid" class="btn-primary disabled:opacity-50">
                    {{ editingMember ? 'Save Changes' : 'Add Member' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Bulk Upload Modal -->
      @if (showUploadModal) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closeUploadModal()"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 class="text-lg font-semibold mb-1">Upload Members Spreadsheet</h3>
              <p class="text-sm text-gray-500 mb-4">
                Upload an <strong>.xlsx</strong> file with columns: <code class="bg-gray-100 px-1 rounded">name</code>, <code class="bg-gray-100 px-1 rounded">phone</code>, and optionally <code class="bg-gray-100 px-1 rounded">email</code>, <code class="bg-gray-100 px-1 rounded">is_host</code>, <code class="bg-gray-100 px-1 rounded">parent_name</code>, <code class="bg-gray-100 px-1 rounded">notes</code>.
                <button (click)="downloadTemplate()" class="ml-1 text-primary-600 hover:underline text-sm font-medium">Download template</button>
              </p>

              @if (!uploadResult) {
                <!-- Drop zone -->
                <div
                  class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
                  [class.border-primary-400]="isDragging"
                  [class.bg-primary-50]="isDragging"
                  [class.border-gray-300]="!isDragging"
                  (dragover)="onDragOver($event)"
                  (dragleave)="isDragging = false"
                  (drop)="onDrop($event)"
                >
                  @if (selectedFile) {
                    <div class="flex items-center justify-center gap-3">
                      <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div class="text-left">
                        <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                        <p class="text-sm text-gray-500">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
                      </div>
                      <button (click)="selectedFile = null" class="ml-auto text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                  } @else {
                    <div>
                      <svg class="mx-auto w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p class="text-gray-600 mb-1">Drag & drop your file here, or</p>
                      <label class="btn-primary cursor-pointer inline-block">
                        Browse file
                        <input type="file" accept=".xlsx,.xls" class="hidden" (change)="onFileSelected($event)" />
                      </label>
                    </div>
                  }
                </div>

                @if (uploadError) {
                  <div class="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ uploadError }}</div>
                }

                <div class="flex justify-end gap-3 mt-5">
                  <button type="button" (click)="closeUploadModal()" class="btn-secondary">Cancel</button>
                  <button
                    type="button"
                    (click)="submitUpload()"
                    [disabled]="!selectedFile || uploading"
                    class="btn-primary disabled:opacity-50"
                  >
                    @if (uploading) { Uploading... } @else { Upload }
                  </button>
                </div>
              } @else {
                <!-- Results -->
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                      <p class="text-2xl font-bold text-green-700">{{ uploadResult.created_count }}</p>
                      <p class="text-sm text-green-600 mt-1">Members added</p>
                    </div>
                    <div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
                      <p class="text-2xl font-bold text-yellow-700">{{ uploadResult.skipped_count }}</p>
                      <p class="text-sm text-yellow-600 mt-1">Rows skipped</p>
                    </div>
                  </div>

                  @if (uploadResult.errors.length > 0) {
                    <div>
                      <p class="text-sm font-medium text-gray-700 mb-2">Row errors:</p>
                      <div class="max-h-48 overflow-y-auto rounded-lg border border-red-200 divide-y divide-red-100">
                        @for (err of uploadResult.errors; track err.row) {
                          <div class="px-3 py-2 text-sm flex gap-3">
                            <span class="font-medium text-red-600 shrink-0">Row {{ err.row }}</span>
                            <span class="text-gray-700">{{ err.message }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <div class="flex justify-end gap-3 pt-2">
                    <button type="button" (click)="resetUpload()" class="btn-secondary">Upload another</button>
                    <button type="button" (click)="closeUploadModal()" class="btn-primary">Done</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteConfirm) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="showDeleteConfirm = false"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Delete Member</h3>
              <p class="mt-2 text-sm text-gray-500">Are you sure you want to delete <strong>{{ memberToDelete?.name }}</strong>? This cannot be undone.</p>
              <div class="mt-6 flex justify-center gap-3">
                <button (click)="showDeleteConfirm = false" class="btn-secondary">Cancel</button>
                <button (click)="deleteMember()" class="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
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
