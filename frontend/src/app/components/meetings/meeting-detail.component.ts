import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { MeetingsService } from '../../services/meetings.service';
import { PaymentsService } from '../../services/contributions.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { MeetingDetail, MemberStatus, PaymentDetail, MEETING_MONTH_NAMES, PAYMENT_METHODS } from '../../models';

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuillModule, LoadingSpinnerComponent],
  templateUrl: './meeting-detail.component.html',
  styleUrl: './meeting-detail.component.css'
})
export class MeetingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private meetingsService = inject(MeetingsService);
  private paymentsService = inject(PaymentsService);

  readonly monthNames = MEETING_MONTH_NAMES;
  readonly paymentMethods = PAYMENT_METHODS;

  detail: MeetingDetail | null = null;
  loading = true;

  expandedIds = new Set<number>();
  togglingAttendance = new Set<number>();

  showPaymentModal = false;
  activeMember: MemberStatus | null = null;
  savingPayment = false;
  paymentError = '';
  paymentForm = { amount: 1000, method: 'cash' as 'cash' | 'mpesa', notes: '' };

  minutes = '';
  savingMinutes = false;
  minutesSaved = false;
  minutesError = '';

  readonly quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote'],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link'],
      ['clean'],
    ],
  };

  get attendedCount(): number {
    return this.detail?.member_statuses.filter(m => m.attended).length ?? 0;
  }

  get hostCount(): number {
    return this.detail?.member_statuses.filter(m => m.is_host).length ?? 0;
  }

  get paidCount(): number {
    return this.detail?.member_statuses.filter(m => m.is_host && m.balance <= 0 && m.total_paid > 0).length ?? 0;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.meetingsService.getDetail(id).subscribe({
      next: (d) => {
        this.detail = d;
        this.minutes = d.minutes ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onMinutesChanged(): void {
    this.minutesSaved = false;
    this.minutesError = '';
  }

  saveMinutes(): void {
    if (!this.detail) return;
    this.savingMinutes = true;
    this.minutesSaved = false;
    this.minutesError = '';
    this.meetingsService.updateMeeting(this.detail.id, { minutes: this.minutes }).subscribe({
      next: () => {
        this.savingMinutes = false;
        this.minutesSaved = true;
      },
      error: () => {
        this.savingMinutes = false;
        this.minutesError = 'Failed to save. Please try again.';
      },
    });
  }

  toggleExpanded(memberId: number): void {
    if (this.expandedIds.has(memberId)) this.expandedIds.delete(memberId);
    else this.expandedIds.add(memberId);
  }

  isExpanded(memberId: number): boolean {
    return this.expandedIds.has(memberId);
  }

  toggleAttendance(ms: MemberStatus): void {
    if (!this.detail) return;
    this.togglingAttendance.add(ms.member_id);
    this.meetingsService.toggleAttendance(this.detail.id, ms.member_id).subscribe({
      next: () => {
        ms.attended = !ms.attended;
        this.togglingAttendance.delete(ms.member_id);
      },
      error: () => { this.togglingAttendance.delete(ms.member_id); },
    });
  }

  openPaymentModal(ms: MemberStatus): void {
    this.activeMember = ms;
    this.paymentError = '';
    this.paymentForm = {
      amount: ms.balance > 0 ? Number(ms.balance) : 1000,
      method: 'cash',
      notes: '',
    };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.activeMember = null;
    this.paymentError = '';
  }

  submitPayment(): void {
    if (!this.detail || !this.activeMember) return;
    this.savingPayment = true;
    this.paymentError = '';
    this.paymentsService.createPayment({
      meeting_id: this.detail.id,
      member_id: this.activeMember.member_id,
      amount: this.paymentForm.amount,
      method: this.paymentForm.method,
      notes: this.paymentForm.notes,
    }).subscribe({
      next: () => {
        this.savingPayment = false;
        this.closePaymentModal();
        this.loading = true;
        this.load();
      },
      error: (err) => {
        this.savingPayment = false;
        this.paymentError = err.error?.message || 'Failed to record payment.';
      },
    });
  }

  deletePayment(ms: MemberStatus, payment: PaymentDetail): void {
    this.paymentsService.deletePayment(payment.id).subscribe({
      next: () => {
        this.loading = true;
        this.load();
      },
    });
  }

  monthName(month: number): string {
    return this.monthNames[month] ?? month.toString();
  }

  statusClass(status: string): string {
    return { scheduled: 'status-scheduled', completed: 'status-completed', cancelled: 'status-rejected' }[status] ?? '';
  }

  balanceClass(balance: number): string {
    if (balance <= 0) return 'text-green-600';
    if (balance < Number(this.detail?.expected_contribution ?? 1000)) return 'text-yellow-600';
    return 'text-red-500';
  }

  balanceLabel(ms: MemberStatus): string {
    if (ms.balance <= 0) return ms.total_paid > 0 ? '✓ Paid' : '—';
    return this.fmt(ms.balance);
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency', currency: 'KES', minimumFractionDigits: 0,
    }).format(value);
  }
}
