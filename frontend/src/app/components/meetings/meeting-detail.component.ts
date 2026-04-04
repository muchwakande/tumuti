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
  styles: [`
    :host ::ng-deep .ql-toolbar {
      border-color: #e5e7eb;
      background: #f9fafb;
    }
    :host ::ng-deep .ql-container {
      border-color: #e5e7eb;
    }
    :host ::ng-deep .ql-editor {
      padding: 1.25rem 1.5rem;
      line-height: 1.75;
    }
    :host ::ng-deep .ql-editor h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    :host ::ng-deep .ql-editor h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    :host ::ng-deep .ql-editor h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
    :host ::ng-deep .ql-editor p { margin-bottom: 0.5rem; }
    :host ::ng-deep .ql-editor ul, :host ::ng-deep .ql-editor ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }
    :host ::ng-deep .ql-editor blockquote {
      border-left: 4px solid #d1d5db;
      padding-left: 1rem;
      color: #6b7280;
      margin: 0.5rem 0;
    }
  `],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-start gap-4 mb-6">
        <a routerLink="/meetings" class="mt-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        @if (detail) {
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3 mb-1">
              <h1 class="text-3xl font-bold text-gray-900">
                {{ monthName(detail.month) }} {{ detail.year }}
              </h1>
              <span [class]="'status-badge ' + statusClass(detail.status)">{{ detail.status | titlecase }}</span>
            </div>
            <p class="text-gray-500">
              {{ detail.date | date:'longDate' }}
              &middot; Host: <span class="font-medium text-gray-700">{{ detail.host_name }}</span>
              &middot; Savings: <span class="font-medium text-gray-700">{{ detail.savings_percentage }}%</span>
              &middot; Expected: <span class="font-medium text-gray-700">{{ fmt(detail.expected_contribution) }}/member</span>
            </p>
          </div>
        }
      </div>

      @if (loading) {
        <app-loading-spinner text="Loading meeting..."></app-loading-spinner>
      } @else if (detail) {

        <!-- Financial summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Expected / Member</p>
            <p class="text-xl font-bold text-gray-900">{{ fmt(detail.expected_contribution) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Total Collected</p>
            <p class="text-xl font-bold text-green-700">{{ fmt(detail.total_collected) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Pooled Savings</p>
            <p class="text-xl font-bold text-purple-700">{{ fmt(detail.total_saved) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">To Host</p>
            <p class="text-xl font-bold text-blue-700">{{ fmt(detail.total_to_host) }}</p>
          </div>
        </div>

        <!-- Members table -->
        <div class="card p-0 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">Members</h2>
            <span class="text-sm text-gray-500">
              {{ attendedCount }} / {{ detail.member_statuses.length }} attended
              &nbsp;&middot;&nbsp;
              {{ paidCount }} / {{ detail.member_statuses.length }} paid in full
            </span>
          </div>

          <div class="overflow-x-auto overflow-y-auto max-h-[480px]">
            <table class="min-w-full">
              <thead class="table-header sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-3 text-left w-6"></th>
                  <th class="px-4 py-3 text-left">Name</th>
                  <th class="px-4 py-3 text-left">Phone</th>
                  <th class="px-4 py-3 text-center">Attendance</th>
                  <th class="px-4 py-3 text-right">Paid</th>
                  <th class="px-4 py-3 text-right">Balance</th>
                  <th class="px-4 py-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                @for (ms of detail.member_statuses; track ms.member_id) {
                  <!-- Member row -->
                  <tr
                    [class]="'border-t border-gray-100 hover:bg-gray-50 cursor-pointer ' + (ms.payments.length > 0 ? '' : 'cursor-default')"
                    (click)="ms.payments.length > 0 ? toggleExpanded(ms.member_id) : null"
                  >
                    <td class="px-4 py-3 text-gray-400 text-sm">
                      @if (ms.payments.length > 0) {
                        {{ isExpanded(ms.member_id) ? '▾' : '▸' }}
                      }
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div [class]="'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ' + (ms.is_host ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600')">
                          {{ ms.member_name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-medium text-gray-900 text-sm">{{ ms.member_name }}</p>
                          @if (ms.is_host) {
                            <span class="text-xs text-primary-600 font-medium">Host</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ ms.member_phone }}</td>
                    <td class="px-4 py-3 text-center">
                      <button
                        (click)="$event.stopPropagation(); toggleAttendance(ms)"
                        [disabled]="togglingAttendance.has(ms.member_id)"
                        [class]="'px-3 py-1 rounded-full text-xs font-medium border transition-colors ' +
                          (ms.attended
                            ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200')"
                      >
                        {{ ms.attended ? '✓ Present' : 'Absent' }}
                      </button>
                    </td>
                    <td class="px-4 py-3 text-right font-medium text-sm">
                      {{ ms.total_paid > 0 ? fmt(ms.total_paid) : '—' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <span [class]="'text-sm font-semibold ' + balanceClass(ms.balance)">
                        {{ balanceLabel(ms) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button
                        (click)="$event.stopPropagation(); openPaymentModal(ms)"
                        class="text-primary-600 hover:text-primary-800 text-sm font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                      >+ Pay</button>
                    </td>
                  </tr>

                  <!-- Nested payment rows -->
                  @if (isExpanded(ms.member_id)) {
                    @for (p of ms.payments; track p.id) {
                      <tr class="bg-gray-50 border-t border-gray-100">
                        <td class="px-4 py-2"></td>
                        <td colspan="2" class="px-4 py-2 pl-14">
                          <span [class]="'inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ' + (p.method === 'mpesa' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700')">
                            {{ p.method === 'mpesa' ? 'MPESA' : 'Cash' }}
                          </span>
                          <span class="text-xs text-gray-400">{{ p.created_at | date:'mediumDate' }}</span>
                          @if (p.notes) {
                            <span class="text-xs text-gray-500 ml-2">— {{ p.notes }}</span>
                          }
                        </td>
                        <td class="px-4 py-2 text-center"></td>
                        <td class="px-4 py-2 text-right text-sm font-medium text-gray-700">{{ fmt(p.amount) }}</td>
                        <td class="px-4 py-2"></td>
                        <td class="px-4 py-2 text-center">
                          <button
                            (click)="deletePayment(ms, p)"
                            class="text-red-400 hover:text-red-600 text-xs px-1"
                            title="Delete payment"
                          >✕</button>
                        </td>
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Minutes -->
        <div class="card mt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Meeting Minutes</h2>
            <div class="flex items-center gap-3">
              @if (minutesSaved) {
                <span class="text-sm text-green-600 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              }
              @if (minutesError) {
                <span class="text-sm text-red-600">{{ minutesError }}</span>
              }
              <button
                (click)="saveMinutes()"
                [disabled]="savingMinutes"
                class="btn-primary text-sm disabled:opacity-50"
              >{{ savingMinutes ? 'Saving...' : 'Save Minutes' }}</button>
            </div>
          </div>
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <quill-editor
              [(ngModel)]="minutes"
              [modules]="quillModules"
              theme="snow"
              format="html"
              (onContentChanged)="onMinutesChanged()"
              [styles]="{ 'min-height': '300px', 'font-size': '15px', 'font-family': 'inherit' }"
              class="block"
            ></quill-editor>
          </div>
        </div>
      }

      <!-- Payment modal -->
      @if (showPaymentModal && activeMember) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closePaymentModal()"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
              <h3 class="text-lg font-semibold mb-1">Record Payment</h3>
              <p class="text-sm text-gray-500 mb-4">
                {{ activeMember.member_name }}
                @if (activeMember.balance > 0) {
                  &middot; Outstanding: <span class="font-medium text-red-600">{{ fmt(activeMember.balance) }}</span>
                } @else {
                  &middot; <span class="text-green-600 font-medium">Fully paid</span>
                }
              </p>

              @if (paymentError) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ paymentError }}</div>
              }

              <form (ngSubmit)="submitPayment()" #pf="ngForm">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (Ksh) *</label>
                    <input
                      type="number"
                      [(ngModel)]="paymentForm.amount"
                      name="amount"
                      required
                      min="1"
                      class="input-field"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                    <div class="flex gap-4">
                      @for (m of paymentMethods; track m.value) {
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="radio" [(ngModel)]="paymentForm.method" name="method" [value]="m.value" class="text-primary-600" />
                          <span class="text-sm text-gray-700">{{ m.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" [(ngModel)]="paymentForm.notes" name="notes" class="input-field" placeholder="Optional..." />
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button type="button" (click)="closePaymentModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="!pf.valid || savingPayment" class="btn-primary disabled:opacity-50">
                    {{ savingPayment ? 'Saving...' : 'Record' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `
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

  get paidCount(): number {
    return this.detail?.member_statuses.filter(m => m.balance <= 0 && m.total_paid > 0).length ?? 0;
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
