import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ContributionsService } from '../../services/contributions.service';
import { MeetingsService } from '../../services/meetings.service';
import { MembersService } from '../../services/members.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import {
  Contribution, ContributionCreate, ContributionUpdate,
  ContributionSummary, Meeting, FamilyMember, MEETING_MONTH_NAMES
} from '../../models';

@Component({
  selector: 'app-contributions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Contributions</h1>
          <p class="text-gray-500 mt-1">Track host contributions per meeting</p>
        </div>
        <button (click)="openCreateModal()" class="btn-primary">+ Record Contribution</button>
      </div>

      <!-- Filter -->
      <div class="card mb-4 flex gap-4 items-center flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600">Meeting:</label>
          <select [(ngModel)]="filterMeetingId" (ngModelChange)="loadContributions()" class="input-field py-1 text-sm w-52">
            <option [ngValue]="null">All meetings</option>
            @for (m of meetings; track m.id) {
              <option [ngValue]="m.id">{{ monthName(m.month) }} {{ m.year }}</option>
            }
          </select>
        </div>
        <span class="text-sm text-gray-500 ml-auto">{{ contributions.length }} contribution(s)</span>
      </div>

      <!-- Summary cards -->
      @if (summary) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Total Amount</p>
            <p class="text-xl font-bold text-gray-900">{{ formatCurrency(summary.total_amount) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Total Saved</p>
            <p class="text-xl font-bold text-purple-700">{{ formatCurrency(summary.total_saved) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">To Host</p>
            <p class="text-xl font-bold text-green-700">{{ formatCurrency(summary.total_to_host) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Count</p>
            <p class="text-xl font-bold text-gray-900">{{ summary.contribution_count }}</p>
          </div>
        </div>
      }

      @if (loading) {
        <app-loading-spinner text="Loading contributions..."></app-loading-spinner>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="table-header">
                <tr>
                  <th class="px-6 py-3">Member</th>
                  <th class="px-6 py-3">Meeting</th>
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3">Amount</th>
                  <th class="px-6 py-3">Saved ({{ savingsPercentage }}%)</th>
                  <th class="px-6 py-3">To Host</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (c of contributions; track c.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="table-cell">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">
                          {{ c.member_name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-medium">{{ c.member_name }}</span>
                      </div>
                    </td>
                    <td class="table-cell text-gray-600">{{ getMeetingName(c.meeting_id) }}</td>
                    <td class="table-cell text-gray-600">{{ c.date | date:'mediumDate' }}</td>
                    <td class="table-cell font-semibold text-gray-900">{{ formatCurrency(c.amount) }}</td>
                    <td class="table-cell font-semibold text-purple-700">{{ formatCurrency(c.saved_amount) }}</td>
                    <td class="table-cell font-semibold text-green-700">{{ formatCurrency(c.host_amount) }}</td>
                    <td class="table-cell">
                      <div class="flex gap-2">
                        <button (click)="editContribution(c)" class="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                        <button (click)="confirmDelete(c)" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-10 text-center text-gray-500">No contributions found.</td>
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
              <h3 class="text-lg font-semibold mb-4">{{ editingContribution ? 'Edit Contribution' : 'Record Contribution' }}</h3>
              @if (formError) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ formError }}</div>
              }
              <form (ngSubmit)="saveContribution()" #contribForm="ngForm">
                <div class="space-y-4">
                  @if (!editingContribution) {
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Meeting *</label>
                      <select [(ngModel)]="createForm.meeting_id" name="meeting_id" required class="input-field">
                        <option [ngValue]="0">Select meeting</option>
                        @for (m of meetings; track m.id) {
                          <option [ngValue]="m.id">{{ monthName(m.month) }} {{ m.year }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Host Member *</label>
                      <select [(ngModel)]="createForm.member_id" name="member_id" required class="input-field">
                        <option [ngValue]="0">Select host</option>
                        @for (h of hosts; track h.id) {
                          <option [ngValue]="h.id">{{ h.name }}</option>
                        }
                      </select>
                      @if (hosts.length === 0) {
                        <p class="text-xs text-yellow-600 mt-1">No hosts available. Mark members as hosts first.</p>
                      }
                    </div>
                  }
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                    <input
                      type="number"
                      [(ngModel)]="editingContribution ? editForm.amount : createForm.amount"
                      name="amount"
                      required min="1" step="0.01"
                      class="input-field"
                      placeholder="0.00"
                    />
                    @if (editingContribution && editForm.amount) {
                      <p class="text-xs text-gray-500 mt-1">
                        Saved: {{ formatCurrency(calcSaved(editForm.amount)) }} |
                        To host: {{ formatCurrency(calcHost(editForm.amount)) }}
                      </p>
                    }
                    @if (!editingContribution && createForm.amount) {
                      <p class="text-xs text-gray-500 mt-1">
                        Saved: {{ formatCurrency(calcSaved(createForm.amount)) }} |
                        To host: {{ formatCurrency(calcHost(createForm.amount)) }}
                      </p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      [(ngModel)]="editingContribution ? editForm.date : createForm.date"
                      name="date"
                      required
                      class="input-field"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      [(ngModel)]="editingContribution ? editForm.notes : createForm.notes"
                      name="notes" rows="2" class="input-field"
                      placeholder="Optional notes..."
                    ></textarea>
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="!contribForm.valid" class="btn-primary disabled:opacity-50">
                    {{ editingContribution ? 'Save Changes' : 'Record' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirm -->
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
              <h3 class="text-lg font-medium">Delete Contribution</h3>
              <p class="mt-2 text-sm text-gray-500">Remove contribution by <strong>{{ contribToDelete?.member_name }}</strong>? This cannot be undone.</p>
              <div class="mt-6 flex justify-center gap-3">
                <button (click)="showDeleteConfirm = false" class="btn-secondary">Cancel</button>
                <button (click)="deleteContribution()" class="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ContributionsListComponent implements OnInit {
  private contributionsService = inject(ContributionsService);
  private meetingsService = inject(MeetingsService);
  private membersService = inject(MembersService);
  private route = inject(ActivatedRoute);

  contributions: Contribution[] = [];
  meetings: Meeting[] = [];
  hosts: FamilyMember[] = [];
  summary: ContributionSummary | null = null;
  loading = true;

  showModal = false;
  showDeleteConfirm = false;
  editingContribution: Contribution | null = null;
  contribToDelete: Contribution | null = null;
  formError = '';

  filterMeetingId: number | null = null;

  readonly today = new Date().toISOString().split('T')[0];

  createForm: ContributionCreate = {
    meeting_id: 0,
    member_id: 0,
    amount: 0,
    notes: '',
    date: this.today,
  };

  editForm: ContributionUpdate = {};

  get savingsPercentage(): number {
    if (!this.filterMeetingId) return 30;
    const m = this.meetings.find(x => x.id === this.filterMeetingId);
    return m ? m.savings_percentage : 30;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['meeting_id']) {
        this.filterMeetingId = +params['meeting_id'];
      }
    });
    this.loadMeetings();
    this.loadHosts();
    this.loadContributions();
  }

  loadContributions(): void {
    this.loading = true;
    const filters: { meeting_id?: number } = {};
    if (this.filterMeetingId) filters.meeting_id = this.filterMeetingId;

    this.contributionsService.getContributions(filters).subscribe({
      next: (c) => { this.contributions = c; this.loading = false; },
      error: () => { this.loading = false; }
    });

    this.contributionsService.getSummary(this.filterMeetingId ?? undefined).subscribe({
      next: (s) => { this.summary = s; }
    });
  }

  loadMeetings(): void {
    this.meetingsService.getMeetings().subscribe({
      next: (m) => { this.meetings = m; }
    });
  }

  loadHosts(): void {
    this.membersService.getMembers({ is_host: true, is_active: true }).subscribe({
      next: (h) => { this.hosts = h; }
    });
  }

  monthName(month: number): string {
    return MEETING_MONTH_NAMES[month] ?? month.toString();
  }

  getMeetingName(meetingId: number): string {
    const m = this.meetings.find(x => x.id === meetingId);
    return m ? `${this.monthName(m.month)} ${m.year}` : `Meeting #${meetingId}`;
  }

  calcSaved(amount: number): number {
    const pct = this.savingsPercentage;
    return Math.round((amount * pct / 100) * 100) / 100;
  }

  calcHost(amount: number): number {
    return Math.round((amount - this.calcSaved(amount)) * 100) / 100;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  openCreateModal(): void {
    this.editingContribution = null;
    this.formError = '';
    this.createForm = {
      meeting_id: this.filterMeetingId ?? 0,
      member_id: 0,
      amount: 0,
      notes: '',
      date: this.today,
    };
    this.showModal = true;
  }

  editContribution(c: Contribution): void {
    this.editingContribution = c;
    this.formError = '';
    this.editForm = { amount: c.amount, notes: c.notes, date: c.date };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingContribution = null;
    this.formError = '';
  }

  saveContribution(): void {
    this.formError = '';
    if (this.editingContribution) {
      this.contributionsService.updateContribution(this.editingContribution.id, this.editForm).subscribe({
        next: () => { this.loadContributions(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to update contribution.'; }
      });
    } else {
      this.contributionsService.createContribution(this.createForm).subscribe({
        next: () => { this.loadContributions(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to record contribution.'; }
      });
    }
  }

  confirmDelete(c: Contribution): void {
    this.contribToDelete = c;
    this.showDeleteConfirm = true;
  }

  deleteContribution(): void {
    if (!this.contribToDelete) return;
    this.contributionsService.deleteContribution(this.contribToDelete.id).subscribe({
      next: () => { this.loadContributions(); this.showDeleteConfirm = false; this.contribToDelete = null; }
    });
  }
}
