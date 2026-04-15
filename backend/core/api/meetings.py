from decimal import Decimal
from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404

from ..models import Meeting, FamilyMember, Attendance, Payment
from ..schemas import (
    MeetingCreate, MeetingUpdate, MeetingOut, MeetingDetailOut,
    MemberStatusOut, PaymentDetailOut, MessageOut,
)
from ..auth import AuthBearer

router = Router(auth=AuthBearer())

VALID_MONTHS = {4, 8, 12}


def meeting_to_out(meeting: Meeting) -> MeetingOut:
    hosts = list(meeting.hosts.all())
    return MeetingOut(
        id=meeting.id,
        year=meeting.year,
        month=meeting.month,
        date=meeting.date,
        host_ids=[h.id for h in hosts],
        host_names=[h.name for h in hosts],
        status=meeting.status,
        savings_percentage=meeting.savings_percentage,
        expected_contribution=meeting.expected_contribution,
        total_collected=meeting.total_collected,
        total_saved=meeting.total_saved,
        total_to_host=meeting.total_to_host,
        notes=meeting.notes,
        minutes=meeting.minutes,
        created_at=meeting.created_at,
        updated_at=meeting.updated_at,
    )


@router.get("/", response=List[MeetingOut])
def list_meetings(
    request,
    year: Optional[int] = None,
    month: Optional[int] = None,
    status: Optional[str] = None,
):
    """List all meetings with optional filters."""
    queryset = Meeting.objects.prefetch_related('hosts').all()
    if year is not None:
        queryset = queryset.filter(year=year)
    if month is not None:
        queryset = queryset.filter(month=month)
    if status:
        queryset = queryset.filter(status=status)
    return [meeting_to_out(m) for m in queryset]


@router.get("/upcoming/", response=List[MeetingOut])
def get_upcoming_meetings(request):
    """Return scheduled meetings ordered by date ascending."""
    from django.utils import timezone
    today = timezone.now().date()
    queryset = Meeting.objects.prefetch_related('hosts').filter(
        status=Meeting.Status.SCHEDULED,
        date__gte=today,
    ).order_by('date')
    return [meeting_to_out(m) for m in queryset]


@router.get("/{meeting_id}/", response={200: MeetingOut, 404: MessageOut})
def get_meeting(request, meeting_id: int):
    """Get a specific meeting by ID."""
    meeting = get_object_or_404(Meeting.objects.prefetch_related('hosts'), id=meeting_id)
    return meeting_to_out(meeting)


@router.post("/", response={201: MeetingOut, 400: MessageOut, 404: MessageOut})
def create_meeting(request, payload: MeetingCreate):
    """Create a new meeting. Month must be 4, 8, or 12."""
    if payload.month not in VALID_MONTHS:
        return 400, {"message": "Meetings can only be scheduled in April (4), August (8), or December (12)"}

    if Meeting.objects.filter(year=payload.year, month=payload.month).exists():
        return 400, {"message": f"A meeting for {payload.month}/{payload.year} already exists"}

    if not payload.host_ids:
        return 400, {"message": "At least one host is required"}

    meeting = Meeting.objects.create(
        year=payload.year,
        month=payload.month,
        date=payload.date,
        status=payload.status,
        savings_percentage=payload.savings_percentage,
        notes=payload.notes,
    )
    hosts = FamilyMember.objects.filter(id__in=payload.host_ids, is_host=True)
    meeting.hosts.set(hosts)
    return 201, meeting_to_out(meeting)


@router.patch("/{meeting_id}/", response={200: MeetingOut, 404: MessageOut, 400: MessageOut})
def update_meeting(request, meeting_id: int, payload: MeetingUpdate):
    """Update a meeting."""
    meeting = get_object_or_404(Meeting.objects.prefetch_related('hosts'), id=meeting_id)

    data = payload.dict(exclude_unset=True)

    if 'host_ids' in data:
        host_ids = data.pop('host_ids')
        hosts = FamilyMember.objects.filter(id__in=host_ids, is_host=True)
        meeting.hosts.set(hosts)

    for attr, value in data.items():
        setattr(meeting, attr, value)
    meeting.save()
    meeting.refresh_from_db()
    return meeting_to_out(meeting)


@router.delete("/{meeting_id}/", response={200: MessageOut, 404: MessageOut})
def delete_meeting(request, meeting_id: int):
    """Delete a meeting."""
    meeting = get_object_or_404(Meeting, id=meeting_id)
    meeting.delete()
    return {"message": "Meeting deleted successfully"}


@router.get("/{meeting_id}/detail/", response={200: MeetingDetailOut, 404: MessageOut})
def get_meeting_detail(request, meeting_id: int):
    """Return meeting info plus all active members with their attendance, payments and balance."""
    meeting = get_object_or_404(Meeting.objects.prefetch_related('hosts'), id=meeting_id)

    members = FamilyMember.objects.filter(is_active=True).order_by('name')

    attended_ids = set(
        Attendance.objects.filter(meeting=meeting).values_list('member_id', flat=True)
    )

    payments_by_member: dict[int, list[Payment]] = {}
    for p in Payment.objects.filter(meeting=meeting).order_by('created_at'):
        payments_by_member.setdefault(p.member_id, []).append(p)

    member_statuses = []
    for member in members:
        member_payments = payments_by_member.get(member.id, [])
        total_paid = sum((p.amount for p in member_payments), Decimal('0.00'))
        member_statuses.append(MemberStatusOut(
            member_id=member.id,
            member_name=member.name,
            member_phone=member.phone,
            is_host=member.is_host,
            attended=member.id in attended_ids,
            total_paid=total_paid,
            balance=meeting.expected_contribution - total_paid,
            payments=[
                PaymentDetailOut(
                    id=p.id,
                    amount=p.amount,
                    method=p.method,
                    notes=p.notes,
                    created_at=p.created_at,
                )
                for p in member_payments
            ],
        ))

    return MeetingDetailOut(
        **meeting_to_out(meeting).model_dump(),
        member_statuses=member_statuses,
    )


@router.post("/{meeting_id}/attendance/{member_id}/", response={200: MessageOut, 404: MessageOut})
def toggle_attendance(request, meeting_id: int, member_id: int):
    """Toggle a member's attendance at a meeting."""
    meeting = get_object_or_404(Meeting, id=meeting_id)
    member = get_object_or_404(FamilyMember, id=member_id)
    attendance, created = Attendance.objects.get_or_create(meeting=meeting, member=member)
    if not created:
        attendance.delete()
        return {"message": "absent"}
    return {"message": "attended"}
