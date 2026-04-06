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
  templateUrl: './meeting-minutes.component.html',
  styleUrl: './meeting-minutes.component.css'
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
