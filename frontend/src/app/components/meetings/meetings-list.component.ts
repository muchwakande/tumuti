import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MeetingsService } from '../../services/meetings.service';
import { MembersService } from '../../services/members.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { Meeting, MeetingCreate, MeetingUpdate, FamilyMember, MEETING_MONTHS, MEETING_MONTH_NAMES } from '../../models';

@Component({
  selector: 'app-meetings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Meetings</h1>
          <p class="text-gray-500 mt-1">Meetings are held in April, August, and December</p>
        </div>
        <button (click)="openCreateModal()" class="btn-primary">+ Schedule Meeting</button>
      </div>

      <!-- Filter -->
      <div class="card mb-4 flex gap-4 items-center flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600">Year:</label>
          <select [(ngModel)]="filterYear" (ngModelChange)="loadMeetings()" class="input-field py-1 text-sm w-28">
            <option [ngValue]="null">All years</option>
            @for (y of years; track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600">Status:</label>
          <select [(ngModel)]="filterStatus" (ngModelChange)="loadMeetings()" class="input-field py-1 text-sm w-36">
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <span class="text-sm text-gray-500 ml-auto">{{ meetings.length }} meeting(s)</span>
      </div>

      @if (loading) {
        <app-loading-spinner text="Loading meetings..."></app-loading-spinner>
      } @else {
        <div class="space-y-4">
          @for (meeting of meetings; track meeting.id) {
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-bold text-gray-900">
                      {{ monthName(meeting.month) }} {{ meeting.year }}
                    </h3>
                    <span [class]="'status-badge ' + statusClass(meeting.status)">
                      {{ meeting.status | titlecase }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500">Date:</span>
                      <p class="font-medium text-gray-900">{{ meeting.date | date:'mediumDate' }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500">Host:</span>
                      <p class="font-medium text-gray-900">{{ meeting.host_name }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500">Savings %:</span>
                      <p class="font-medium text-gray-900">{{ meeting.savings_percentage }}%</p>
                    </div>
                    <div>
                      <span class="text-gray-500">Total Contributions:</span>
                      <p class="font-medium text-green-700">{{ formatCurrency(meeting.total_contributions) }}</p>
                    </div>
                  </div>
                  @if (meeting.total_contributions > 0) {
                    <div class="mt-3 flex gap-6 text-sm">
                      <div>
                        <span class="text-gray-500">Pooled Savings:</span>
                        <span class="ml-1 font-semibold text-purple-700">{{ formatCurrency(meeting.total_saved) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">To Host:</span>
                        <span class="ml-1 font-semibold text-blue-700">{{ formatCurrency(meeting.total_to_host) }}</span>
                      </div>
                    </div>
                  }
                </div>
                <div class="flex flex-col gap-2 ml-4">
                  <a [routerLink]="['/contributions']" [queryParams]="{meeting_id: meeting.id}" class="btn-secondary text-xs text-center">
                    Contributions
                  </a>
                  <button (click)="editMeeting(meeting)" class="text-primary-600 hover:text-primary-800 text-xs font-medium text-right">Edit</button>
                  <button (click)="confirmDelete(meeting)" class="text-red-600 hover:text-red-800 text-xs font-medium text-right">Delete</button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="card text-center py-12">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-500 text-lg">No meetings found.</p>
              <p class="text-gray-400 text-sm mt-1">Schedule a meeting in April, August, or December.</p>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closeModal()"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 class="text-lg font-semibold mb-4">{{ editingMeeting ? 'Edit Meeting' : 'Schedule Meeting' }}</h3>
              @if (formError) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ formError }}</div>
              }
              <form (ngSubmit)="saveMeeting()" #meetingForm="ngForm">
                <div class="space-y-4">
                  @if (!editingMeeting) {
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                        <input type="number" [(ngModel)]="form.year" name="year" required min="2020" max="2100" class="input-field" [placeholder]="currentYear.toString()" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                        <select [(ngModel)]="form.month" name="month" required class="input-field">
                          <option [ngValue]="0">Select month</option>
                          @for (m of validMonths; track m.value) {
                            <option [ngValue]="m.value">{{ m.label }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  }
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" [(ngModel)]="form.date" name="date" required class="input-field" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Host *</label>
                    <select [(ngModel)]="form.host_id" name="host_id" required class="input-field">
                      <option [ngValue]="0">Select a host</option>
                      @for (host of hosts; track host.id) {
                        <option [ngValue]="host.id">{{ host.name }}</option>
                      }
                    </select>
                    @if (hosts.length === 0) {
                      <p class="text-xs text-yellow-600 mt-1">No hosts available. Mark members as hosts first.</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Savings Percentage (%)</label>
                    <input type="number" [(ngModel)]="form.savings_percentage" name="savings_percentage" min="0" max="100" step="0.01" class="input-field" />
                  </div>
                  @if (editingMeeting) {
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select [(ngModel)]="form.status" name="status" class="input-field">
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  }
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea [(ngModel)]="form.notes" name="notes" rows="2" class="input-field" placeholder="Optional notes..."></textarea>
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="!meetingForm.valid" class="btn-primary disabled:opacity-50">
                    {{ editingMeeting ? 'Save Changes' : 'Schedule' }}
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
              <h3 class="text-lg font-medium">Delete Meeting</h3>
              <p class="mt-2 text-sm text-gray-500">Delete <strong>{{ meetingToDelete ? monthName(meetingToDelete.month) + ' ' + meetingToDelete.year : '' }}</strong>? All contributions will also be deleted.</p>
              <div class="mt-6 flex justify-center gap-3">
                <button (click)="showDeleteConfirm = false" class="btn-secondary">Cancel</button>
                <button (click)="deleteMeeting()" class="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MeetingsListComponent implements OnInit {
  private meetingsService = inject(MeetingsService);
  private membersService = inject(MembersService);

  meetings: Meeting[] = [];
  hosts: FamilyMember[] = [];
  loading = true;
  showModal = false;
  showDeleteConfirm = false;
  editingMeeting: Meeting | null = null;
  meetingToDelete: Meeting | null = null;
  formError = '';

  filterYear: number | null = null;
  filterStatus = '';

  readonly validMonths = MEETING_MONTHS;
  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 10 }, (_, i) => this.currentYear - 2 + i);

  form: MeetingCreate & { status?: string } = this.emptyForm();

  ngOnInit(): void {
    this.loadMeetings();
    this.loadHosts();
  }

  emptyForm(): MeetingCreate {
    return {
      year: this.currentYear,
      month: 0,
      date: '',
      host_id: 0,
      status: 'scheduled',
      savings_percentage: 30,
      notes: '',
    };
  }

  loadMeetings(): void {
    this.loading = true;
    const filters: { year?: number; status?: string } = {};
    if (this.filterYear) filters.year = this.filterYear;
    if (this.filterStatus) filters.status = this.filterStatus;

    this.meetingsService.getMeetings(filters).subscribe({
      next: (m) => { this.meetings = m; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadHosts(): void {
    this.membersService.getMembers({ is_host: true, is_active: true }).subscribe({
      next: (members) => { this.hosts = members; }
    });
  }

  monthName(month: number): string {
    return MEETING_MONTH_NAMES[month] ?? month.toString();
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      scheduled: 'status-approved',
      completed: 'status-completed',
      cancelled: 'status-rejected',
    };
    return map[status] ?? '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  openCreateModal(): void {
    this.editingMeeting = null;
    this.formError = '';
    this.form = this.emptyForm();
    this.showModal = true;
  }

  editMeeting(meeting: Meeting): void {
    this.editingMeeting = meeting;
    this.formError = '';
    this.form = {
      year: meeting.year,
      month: meeting.month,
      date: meeting.date,
      host_id: meeting.host_id,
      status: meeting.status,
      savings_percentage: meeting.savings_percentage,
      notes: meeting.notes,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingMeeting = null;
    this.formError = '';
  }

  saveMeeting(): void {
    this.formError = '';
    if (this.editingMeeting) {
      const update: MeetingUpdate = {
        date: this.form.date,
        host_id: this.form.host_id,
        status: this.form.status,
        savings_percentage: this.form.savings_percentage,
        notes: this.form.notes,
      };
      this.meetingsService.updateMeeting(this.editingMeeting.id, update).subscribe({
        next: () => { this.loadMeetings(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to update meeting.'; }
      });
    } else {
      this.meetingsService.createMeeting(this.form).subscribe({
        next: () => { this.loadMeetings(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to schedule meeting.'; }
      });
    }
  }

  confirmDelete(meeting: Meeting): void {
    this.meetingToDelete = meeting;
    this.showDeleteConfirm = true;
  }

  deleteMeeting(): void {
    if (!this.meetingToDelete) return;
    this.meetingsService.deleteMeeting(this.meetingToDelete.id).subscribe({
      next: () => { this.loadMeetings(); this.showDeleteConfirm = false; this.meetingToDelete = null; }
    });
  }
}
