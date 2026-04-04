import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { MeetingsService } from '../../services/meetings.service';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { Meeting, MEETING_MONTH_NAMES } from '../../models';

@Component({
  selector: 'app-meeting-minutes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuillModule, LoadingSpinnerComponent],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/meetings" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900">
            @if (meeting) { {{ monthName(meeting.month) }} {{ meeting.year }} — Minutes }
            @else { Meeting Minutes }
          </h1>
          @if (meeting) {
            <p class="text-gray-500 mt-1">
              {{ meeting.date | date:'longDate' }} &middot; Host: {{ meeting.host_name }}
              <span [class]="'ml-2 status-badge ' + statusClass(meeting.status)">{{ meeting.status | titlecase }}</span>
            </p>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (saved) {
            <span class="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          }
          @if (saveError) {
            <span class="text-sm text-red-600">{{ saveError }}</span>
          }
          <button
            (click)="save()"
            [disabled]="loading || saving"
            class="btn-primary disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : 'Save Minutes' }}
          </button>
        </div>
      </div>

      @if (loading) {
        <app-loading-spinner text="Loading meeting..."></app-loading-spinner>
      } @else if (!meeting) {
        <div class="card text-center py-12">
          <p class="text-gray-500">Meeting not found.</p>
        </div>
      } @else {
        <div class="card p-0 overflow-hidden">
          <quill-editor
            [(ngModel)]="minutes"
            [modules]="quillModules"
            theme="snow"
            format="html"
            (onContentChanged)="onContentChanged()"
            [styles]="{ 'min-height': '500px', 'font-size': '15px', 'font-family': 'inherit' }"
            class="block"
          ></quill-editor>
        </div>

        @if (meeting.minutes) {
          <p class="text-xs text-gray-400 mt-2 text-right">
            Last updated: {{ meeting.updated_at | date:'medium' }}
          </p>
        }
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .ql-toolbar {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      border-color: #e5e7eb;
      background: #f9fafb;
    }
    :host ::ng-deep .ql-container {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
      border-color: #e5e7eb;
    }
    :host ::ng-deep .ql-editor {
      padding: 1.5rem;
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
  `]
})
export class MeetingMinutesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private meetingsService = inject(MeetingsService);

  readonly monthNames = MEETING_MONTH_NAMES;

  meeting: Meeting | null = null;
  minutes = '';
  loading = true;
  saving = false;
  saved = false;
  saveError = '';

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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.meetingsService.getMeeting(id).subscribe({
      next: (m) => {
        this.meeting = m;
        this.minutes = m.minutes ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onContentChanged(): void {
    this.saved = false;
    this.saveError = '';
  }

  save(): void {
    if (!this.meeting) return;
    this.saving = true;
    this.saved = false;
    this.saveError = '';
    this.meetingsService.updateMeeting(this.meeting.id, { minutes: this.minutes }).subscribe({
      next: (updated) => {
        this.meeting = updated;
        this.saving = false;
        this.saved = true;
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Failed to save. Please try again.';
      },
    });
  }

  monthName(month: number): string {
    return this.monthNames[month] ?? month.toString();
  }

  statusClass(status: string): string {
    return { scheduled: 'status-scheduled', completed: 'status-completed', cancelled: 'status-rejected' }[status] ?? '';
  }
}
