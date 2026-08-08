import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../../services/contributions.service';
import { MeetingsService } from '../../services/meetings.service';
import { MembersService } from '../../services/members.service';
import { WelfareEventsService } from '../../services/welfare-events.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import {
  Payment, PaymentCreate, PaymentSummary, Meeting, FamilyMember, WelfareEvent,
  MEETING_MONTH_NAMES, PAYMENT_METHODS, WELFARE_EVENT_TYPE_LABELS, WelfareEventType,
} from '../../models';

type PaymentTarget = 'meeting' | 'welfare_event';

@Component({
  selector: 'app-contributions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './contributions-list.component.html'
})
export class ContributionsListComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  private meetingsService = inject(MeetingsService);
  private membersService = inject(MembersService);
  private welfareEventsService = inject(WelfareEventsService);
  private route = inject(ActivatedRoute);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly monthNames = MEETING_MONTH_NAMES;
  readonly eventTypeLabels = WELFARE_EVENT_TYPE_LABELS;

  payments: Payment[] = [];
  meetings: Meeting[] = [];
  welfareEvents: WelfareEvent[] = [];
  members: FamilyMember[] = [];
  summary: PaymentSummary | null = null;
  loading = true;

  filterMeetingId: number | null = null;
  filterWelfareEventId: number | null = null;

  showModal = false;
  saving = false;
  formError = '';
  formTarget: PaymentTarget = 'meeting';
  form: PaymentCreate = { meeting_id: 0, member_id: 0, amount: 1000, method: 'cash', notes: '' };

  showDeleteConfirm = false;
  paymentToDelete: Payment | null = null;

  ngOnInit(): void {
    const qMeetingId = this.route.snapshot.queryParamMap.get('meeting_id');
    if (qMeetingId) this.filterMeetingId = +qMeetingId;
    const qWelfareEventId = this.route.snapshot.queryParamMap.get('welfare_event_id');
    if (qWelfareEventId) this.filterWelfareEventId = +qWelfareEventId;

    this.meetingsService.getMeetings().subscribe(m => this.meetings = m);
    this.welfareEventsService.getEvents().subscribe(e => this.welfareEvents = e);
    this.membersService.getMembers({ is_active: true }).subscribe(m => this.members = m);
    this.load();
  }

  load(): void {
    this.loading = true;
    const filters: { meeting_id?: number; welfare_event_id?: number; member_id?: number } = {};
    if (this.filterMeetingId) filters.meeting_id = this.filterMeetingId;
    if (this.filterWelfareEventId) filters.welfare_event_id = this.filterWelfareEventId;

    this.paymentsService.getPayments(Object.keys(filters).length ? filters : undefined).subscribe({
      next: (p) => { this.payments = p; this.loading = false; }
    });
    this.paymentsService.getSummary(this.filterMeetingId ?? undefined).subscribe({
      next: (s) => { this.summary = s; }
    });
  }

  monthName(month: number): string {
    return this.monthNames[month] ?? month.toString();
  }

  eventTypeLabel(type: string): string {
    return this.eventTypeLabels[type as WelfareEventType] ?? type;
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(value);
  }

  openCreateModal(): void {
    this.formError = '';
    this.formTarget = this.filterWelfareEventId ? 'welfare_event' : 'meeting';
    this.form = {
      meeting_id: this.filterMeetingId ?? 0,
      welfare_event_id: this.filterWelfareEventId ?? 0,
      member_id: 0,
      amount: 1000,
      method: 'cash',
      notes: '',
    };
    this.showModal = true;
  }

  setFormTarget(target: PaymentTarget): void {
    this.formTarget = target;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  get canSave(): boolean {
    if (this.form.member_id === 0) return false;
    if (this.formTarget === 'meeting') return !!this.form.meeting_id;
    return !!this.form.welfare_event_id;
  }

  save(): void {
    this.saving = true;
    this.formError = '';
    const payload: PaymentCreate = this.formTarget === 'meeting'
      ? { member_id: this.form.member_id, amount: this.form.amount, method: this.form.method, notes: this.form.notes, meeting_id: this.form.meeting_id }
      : { member_id: this.form.member_id, amount: this.form.amount, method: this.form.method, notes: this.form.notes, welfare_event_id: this.form.welfare_event_id };

    this.paymentsService.createPayment(payload).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: (err) => { this.saving = false; this.formError = err.error?.message || 'Failed to record payment.'; }
    });
  }

  confirmDelete(p: Payment): void {
    this.paymentToDelete = p;
    this.showDeleteConfirm = true;
  }

  deletePayment(): void {
    if (!this.paymentToDelete) return;
    this.paymentsService.deletePayment(this.paymentToDelete.id).subscribe({
      next: () => { this.showDeleteConfirm = false; this.paymentToDelete = null; this.load(); }
    });
  }
}
