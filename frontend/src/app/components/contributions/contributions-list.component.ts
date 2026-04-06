import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../../services/contributions.service';
import { MeetingsService } from '../../services/meetings.service';
import { MembersService } from '../../services/members.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { Payment, PaymentCreate, PaymentSummary, Meeting, FamilyMember, MEETING_MONTH_NAMES, PAYMENT_METHODS } from '../../models';

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
  private route = inject(ActivatedRoute);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly monthNames = MEETING_MONTH_NAMES;

  payments: Payment[] = [];
  meetings: Meeting[] = [];
  members: FamilyMember[] = [];
  summary: PaymentSummary | null = null;
  loading = true;

  filterMeetingId: number | null = null;

  showModal = false;
  saving = false;
  formError = '';
  form: PaymentCreate = { meeting_id: 0, member_id: 0, amount: 1000, method: 'cash', notes: '' };

  showDeleteConfirm = false;
  paymentToDelete: Payment | null = null;

  ngOnInit(): void {
    const qMeetingId = this.route.snapshot.queryParamMap.get('meeting_id');
    if (qMeetingId) this.filterMeetingId = +qMeetingId;

    this.meetingsService.getMeetings().subscribe(m => this.meetings = m);
    this.membersService.getMembers({ is_active: true }).subscribe(m => this.members = m);
    this.load();
  }

  load(): void {
    this.loading = true;
    const filters = this.filterMeetingId ? { meeting_id: this.filterMeetingId } : undefined;

    this.paymentsService.getPayments(filters).subscribe({
      next: (p) => { this.payments = p; this.loading = false; }
    });
    this.paymentsService.getSummary(this.filterMeetingId ?? undefined).subscribe({
      next: (s) => { this.summary = s; }
    });
  }

  monthName(month: number): string {
    return this.monthNames[month] ?? month.toString();
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(value);
  }

  openCreateModal(): void {
    this.formError = '';
    this.form = {
      meeting_id: this.filterMeetingId ?? 0,
      member_id: 0,
      amount: 1000,
      method: 'cash',
      notes: '',
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
  }

  save(): void {
    this.saving = true;
    this.formError = '';
    this.paymentsService.createPayment(this.form).subscribe({
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
