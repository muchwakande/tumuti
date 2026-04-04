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
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Payments</h1>
          <p class="text-gray-500 mt-1">Record and view member payments per meeting</p>
        </div>
        <button (click)="openCreateModal()" class="btn-primary">+ Record Payment</button>
      </div>

      <!-- Filters -->
      <div class="card mb-4 flex gap-4 items-center flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-600">Meeting:</label>
          <select [(ngModel)]="filterMeetingId" (ngModelChange)="load()" class="input-field py-1 text-sm w-48">
            <option [ngValue]="null">All meetings</option>
            @for (m of meetings; track m.id) {
              <option [ngValue]="m.id">{{ monthName(m.month) }} {{ m.year }}</option>
            }
          </select>
        </div>
        <span class="text-sm text-gray-500 ml-auto">{{ payments.length }} payment(s)</span>
      </div>

      <!-- Summary cards -->
      @if (summary) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Total Collected</p>
            <p class="text-xl font-bold text-gray-900">{{ fmt(summary.total_collected) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Pooled Savings</p>
            <p class="text-xl font-bold text-purple-700">{{ fmt(summary.total_saved) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">To Host</p>
            <p class="text-xl font-bold text-blue-700">{{ fmt(summary.total_to_host) }}</p>
          </div>
          <div class="card text-center">
            <p class="text-xs text-gray-500 mb-1">Payments</p>
            <p class="text-xl font-bold text-gray-900">{{ summary.payment_count }}</p>
          </div>
        </div>
      }

      @if (loading) {
        <app-loading-spinner text="Loading payments..."></app-loading-spinner>
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="table-header">
                <tr>
                  <th class="px-6 py-3 text-left">Member</th>
                  <th class="px-6 py-3 text-left">Meeting</th>
                  <th class="px-6 py-3 text-left">Amount</th>
                  <th class="px-6 py-3 text-left">Method</th>
                  <th class="px-6 py-3 text-left">Notes</th>
                  <th class="px-6 py-3 text-left">Recorded</th>
                  <th class="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (p of payments; track p.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="table-cell font-medium text-gray-900">{{ p.member_name }}</td>
                    <td class="table-cell text-gray-600">{{ p.meeting_label }}</td>
                    <td class="table-cell font-semibold text-gray-900">{{ fmt(p.amount) }}</td>
                    <td class="table-cell">
                      <span [class]="'status-badge ' + (p.method === 'mpesa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')">
                        {{ p.method === 'mpesa' ? 'MPESA' : 'Cash' }}
                      </span>
                    </td>
                    <td class="table-cell text-gray-500 text-sm">{{ p.notes || '—' }}</td>
                    <td class="table-cell text-gray-500 text-sm">{{ p.created_at | date:'mediumDate' }}</td>
                    <td class="table-cell">
                      <button (click)="confirmDelete(p)" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-10 text-center text-gray-500">No payments found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Record Payment Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closeModal()"></div>
            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 class="text-lg font-semibold mb-4">Record Payment</h3>
              @if (formError) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{{ formError }}</div>
              }
              <form (ngSubmit)="save()" #f="ngForm">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meeting *</label>
                    <select [(ngModel)]="form.meeting_id" name="meeting_id" required class="input-field">
                      <option [ngValue]="0" disabled>Select a meeting</option>
                      @for (m of meetings; track m.id) {
                        <option [ngValue]="m.id">{{ monthName(m.month) }} {{ m.year }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Member *</label>
                    <select [(ngModel)]="form.member_id" name="member_id" required class="input-field">
                      <option [ngValue]="0" disabled>Select a member</option>
                      @for (m of members; track m.id) {
                        <option [ngValue]="m.id">{{ m.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (Ksh) *</label>
                    <input type="number" [(ngModel)]="form.amount" name="amount" required min="1" class="input-field" placeholder="1000" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <div class="flex gap-3">
                      @for (method of paymentMethods; track method.value) {
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="radio" [(ngModel)]="form.method" name="method" [value]="method.value" class="text-primary-600" />
                          <span class="text-sm text-gray-700">{{ method.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" [(ngModel)]="form.notes" name="notes" class="input-field" placeholder="Optional notes..." />
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="!f.valid || form.meeting_id === 0 || form.member_id === 0 || saving" class="btn-primary disabled:opacity-50">
                    {{ saving ? 'Saving...' : 'Record Payment' }}
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
              <h3 class="text-lg font-medium text-gray-900">Delete Payment</h3>
              <p class="mt-2 text-sm text-gray-500">
                Delete <strong>{{ fmt(paymentToDelete?.amount ?? 0) }}</strong> payment from
                <strong>{{ paymentToDelete?.member_name }}</strong>? This cannot be undone.
              </p>
              <div class="mt-6 flex justify-center gap-3">
                <button (click)="showDeleteConfirm = false" class="btn-secondary">Cancel</button>
                <button (click)="deletePayment()" class="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
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
