import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WelfareEventsService } from '../../services/welfare-events.service';
import { MembersService } from '../../services/members.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import {
  WelfareEvent, WelfareEventCreate, WelfareEventUpdate, FamilyMember,
  WELFARE_EVENT_TYPES, WELFARE_EVENT_TYPE_LABELS, WelfareEventType,
} from '../../models';

@Component({
  selector: 'app-welfare-events-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './welfare-events-list.component.html'
})
export class WelfareEventsListComponent implements OnInit {
  private welfareEventsService = inject(WelfareEventsService);
  private membersService = inject(MembersService);

  readonly eventTypes = WELFARE_EVENT_TYPES;
  readonly eventTypeLabels = WELFARE_EVENT_TYPE_LABELS;

  events: WelfareEvent[] = [];
  members: FamilyMember[] = [];
  loading = true;

  filterEventType = '';

  showModal = false;
  showDeleteConfirm = false;
  editingEvent: WelfareEvent | null = null;
  eventToDelete: WelfareEvent | null = null;
  formError = '';

  form: WelfareEventCreate = this.emptyForm();

  ngOnInit(): void {
    this.loadEvents();
    this.membersService.getMembers({ is_active: true }).subscribe(m => this.members = m);
  }

  emptyForm(): WelfareEventCreate {
    return {
      member_id: 0,
      event_type: 'wedding',
      date: '',
      contribution_expected: null,
      notes: '',
    };
  }

  loadEvents(): void {
    this.loading = true;
    const filters = this.filterEventType ? { event_type: this.filterEventType } : undefined;
    this.welfareEventsService.getEvents(filters).subscribe({
      next: (e) => { this.events = e; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  eventTypeLabel(type: string): string {
    return this.eventTypeLabels[type as WelfareEventType] ?? type;
  }

  eventTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      wedding: 'bg-pink-100 text-pink-700',
      graduation: 'bg-blue-100 text-blue-700',
      death: 'bg-gray-200 text-gray-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-700';
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(value);
  }

  openCreateModal(): void {
    this.editingEvent = null;
    this.formError = '';
    this.form = this.emptyForm();
    this.showModal = true;
  }

  editEvent(event: WelfareEvent): void {
    this.editingEvent = event;
    this.formError = '';
    this.form = {
      member_id: event.member_id,
      event_type: event.event_type,
      date: event.date,
      contribution_expected: event.contribution_expected,
      notes: event.notes,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEvent = null;
    this.formError = '';
  }

  saveEvent(): void {
    this.formError = '';
    if (this.editingEvent) {
      const update: WelfareEventUpdate = {
        member_id: this.form.member_id,
        event_type: this.form.event_type,
        date: this.form.date,
        contribution_expected: this.form.contribution_expected,
        notes: this.form.notes,
      };
      this.welfareEventsService.updateEvent(this.editingEvent.id, update).subscribe({
        next: () => { this.loadEvents(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to update welfare event.'; }
      });
    } else {
      this.welfareEventsService.createEvent(this.form).subscribe({
        next: () => { this.loadEvents(); this.closeModal(); },
        error: (err) => { this.formError = err.error?.message || 'Failed to create welfare event.'; }
      });
    }
  }

  confirmDelete(event: WelfareEvent): void {
    this.eventToDelete = event;
    this.showDeleteConfirm = true;
  }

  deleteEvent(): void {
    if (!this.eventToDelete) return;
    this.welfareEventsService.deleteEvent(this.eventToDelete.id).subscribe({
      next: () => { this.loadEvents(); this.showDeleteConfirm = false; this.eventToDelete = null; }
    });
  }
}
