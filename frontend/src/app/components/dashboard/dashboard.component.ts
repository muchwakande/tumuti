import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { MembersService } from '../../services/members.service';
import { MeetingsService } from '../../services/meetings.service';
import { PaymentsService } from '../../services/contributions.service';
import { Meeting, PaymentSummary, MEETING_MONTH_NAMES } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private membersService = inject(MembersService);
  private meetingsService = inject(MeetingsService);
  private paymentsService = inject(PaymentsService);

  loading = true;
  totalMembers = 0;
  activeHosts = 0;
  nextMeeting: Meeting | null = null;
  summary: PaymentSummary | null = null;

  readonly monthNames = MEETING_MONTH_NAMES;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      members: this.membersService.getMembers({ is_active: true }),
      hosts: this.membersService.getMembers({ is_host: true, is_active: true }),
      upcoming: this.meetingsService.getUpcoming(),
      summary: this.paymentsService.getSummary(),
    }).subscribe({
      next: (data) => {
        this.totalMembers = data.members.length;
        this.activeHosts = data.hosts.length;
        this.nextMeeting = data.upcoming[0] ?? null;
        this.summary = data.summary;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  monthName(month: number): string {
    return this.monthNames[month] ?? month.toString();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
