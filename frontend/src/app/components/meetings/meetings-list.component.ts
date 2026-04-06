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
  templateUrl: './meetings-list.component.html'
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
