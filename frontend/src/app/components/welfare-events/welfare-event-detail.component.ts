import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { WelfareEventsService } from '../../services/welfare-events.service';
import { PaymentsService } from '../../services/contributions.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import {
  WelfareEventDetail, HostContributionStatus, PaymentDetail,
  WELFARE_EVENT_TYPE_LABELS, WelfareEventType, PAYMENT_METHODS,
} from '../../models';

@Component({
  selector: 'app-welfare-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './welfare-event-detail.component.html'
})
export class WelfareEventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private welfareEventsService = inject(WelfareEventsService);
  private paymentsService = inject(PaymentsService);

  readonly eventTypeLabels = WELFARE_EVENT_TYPE_LABELS;
  readonly paymentMethods = PAYMENT_METHODS;

  detail: WelfareEventDetail | null = null;
  loading = true;

  expandedIds = new Set<number>();

  showPaymentModal = false;
  activeHost: HostContributionStatus | null = null;
  savingPayment = false;
  paymentError = '';
  paymentForm = { amount: 0, method: 'cash' as 'cash' | 'mpesa', notes: '' };

  showPayoutModal = false;
  savingPayout = false;
  payoutError = '';
  payoutForm = { amount: 0, status: 'pending' as 'pending' | 'paid', paid_date: '', notes: '' };

  get contributedCount(): number {
    return this.detail?.host_statuses.filter(h => h.balance <= 0 && h.total_paid > 0).length ?? 0;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.welfareEventsService.getDetail(id).subscribe({
      next: (d) => { this.detail = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  eventTypeLabel(type: string): string {
    return this.eventTypeLabels[type as WelfareEventType] ?? type;
  }

  toggleExpanded(memberId: number): void {
    if (this.expandedIds.has(memberId)) this.expandedIds.delete(memberId);
    else this.expandedIds.add(memberId);
  }

  isExpanded(memberId: number): boolean {
    return this.expandedIds.has(memberId);
  }

  balanceClass(h: HostContributionStatus): string {
    if (h.balance <= 0) return 'text-green-600';
    return 'text-red-500';
  }

  balanceLabel(h: HostContributionStatus): string {
    if (h.balance <= 0) return h.total_paid > 0 ? '✓ Paid' : '—';
    return this.fmt(h.balance);
  }

  openPaymentModal(host: HostContributionStatus): void {
    this.activeHost = host;
    this.paymentError = '';
    this.paymentForm = {
      amount: host.balance > 0 ? Number(host.balance) : (this.detail?.contribution_expected ? Number(this.detail.contribution_expected) : 0),
      method: 'cash',
      notes: '',
    };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.activeHost = null;
    this.paymentError = '';
  }

  submitPayment(): void {
    if (!this.detail || !this.activeHost) return;
    this.savingPayment = true;
    this.paymentError = '';
    this.paymentsService.createPayment({
      welfare_event_id: this.detail.id,
      member_id: this.activeHost.member_id,
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
        this.paymentError = err.error?.message || 'Failed to record contribution.';
      },
    });
  }

  deletePayment(payment: PaymentDetail): void {
    this.paymentsService.deletePayment(payment.id).subscribe({
      next: () => { this.loading = true; this.load(); },
    });
  }

  openPayoutModal(): void {
    this.payoutError = '';
    if (this.detail?.payout) {
      this.payoutForm = {
        amount: Number(this.detail.payout.amount),
        status: this.detail.payout.status,
        paid_date: this.detail.payout.paid_date ?? '',
        notes: this.detail.payout.notes,
      };
    } else {
      this.payoutForm = { amount: 0, status: 'pending', paid_date: '', notes: '' };
    }
    this.showPayoutModal = true;
  }

  closePayoutModal(): void {
    this.showPayoutModal = false;
    this.payoutError = '';
  }

  submitPayout(): void {
    if (!this.detail) return;
    if (this.payoutForm.status === 'paid' && !this.payoutForm.paid_date) {
      this.payoutError = 'A paid date is required when marking the payout as paid.';
      return;
    }
    this.savingPayout = true;
    this.payoutError = '';
    const data = {
      amount: this.payoutForm.amount,
      status: this.payoutForm.status,
      paid_date: this.payoutForm.paid_date || null,
      notes: this.payoutForm.notes,
    };
    const request = this.detail.payout
      ? this.welfareEventsService.updatePayout(this.detail.id, data)
      : this.welfareEventsService.createPayout(this.detail.id, data);
    request.subscribe({
      next: () => {
        this.savingPayout = false;
        this.closePayoutModal();
        this.loading = true;
        this.load();
      },
      error: (err) => {
        this.savingPayout = false;
        this.payoutError = err.error?.message || 'Failed to save payout.';
      },
    });
  }

  deletePayout(): void {
    if (!this.detail) return;
    this.welfareEventsService.deletePayout(this.detail.id).subscribe({
      next: () => { this.loading = true; this.load(); },
    });
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency', currency: 'KES', minimumFractionDigits: 0,
    }).format(value);
  }
}
