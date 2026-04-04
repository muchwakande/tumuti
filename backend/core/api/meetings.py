from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404

from ..models import Meeting, FamilyMember
from ..schemas import MeetingCreate, MeetingUpdate, MeetingOut, MessageOut
from ..auth import AuthBearer

router = Router(auth=AuthBearer())

VALID_MONTHS = {4, 8, 12}


def meeting_to_out(meeting: Meeting) -> MeetingOut:
    return MeetingOut(
        id=meeting.id,
        year=meeting.year,
        month=meeting.month,
        date=meeting.date,
        host_id=meeting.host_id,
        host_name=meeting.host.name,
        status=meeting.status,
        savings_percentage=meeting.savings_percentage,
        total_contributions=meeting.total_contributions,
        total_saved=meeting.total_saved,
        total_to_host=meeting.total_to_host,
        notes=meeting.notes,
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
    queryset = Meeting.objects.select_related('host').all()
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
    queryset = Meeting.objects.select_related('host').filter(
        status=Meeting.Status.SCHEDULED,
        date__gte=today,
    ).order_by('date')
    return [meeting_to_out(m) for m in queryset]


@router.get("/{meeting_id}/", response={200: MeetingOut, 404: MessageOut})
def get_meeting(request, meeting_id: int):
    """Get a specific meeting by ID."""
    meeting = get_object_or_404(Meeting.objects.select_related('host'), id=meeting_id)
    return meeting_to_out(meeting)


@router.post("/", response={201: MeetingOut, 400: MessageOut, 404: MessageOut})
def create_meeting(request, payload: MeetingCreate):
    """Create a new meeting. Month must be 4, 8, or 12."""
    if payload.month not in VALID_MONTHS:
        return 400, {"message": "Meetings can only be scheduled in April (4), August (8), or December (12)"}

    if Meeting.objects.filter(year=payload.year, month=payload.month).exists():
        return 400, {"message": f"A meeting for {payload.month}/{payload.year} already exists"}

    host = get_object_or_404(FamilyMember, id=payload.host_id, is_host=True)

    meeting = Meeting.objects.create(
        year=payload.year,
        month=payload.month,
        date=payload.date,
        host=host,
        status=payload.status,
        savings_percentage=payload.savings_percentage,
        notes=payload.notes,
    )
    return 201, meeting_to_out(meeting)


@router.patch("/{meeting_id}/", response={200: MeetingOut, 404: MessageOut, 400: MessageOut})
def update_meeting(request, meeting_id: int, payload: MeetingUpdate):
    """Update a meeting."""
    meeting = get_object_or_404(Meeting.objects.select_related('host'), id=meeting_id)

    data = payload.dict(exclude_unset=True)

    if 'host_id' in data:
        host = get_object_or_404(FamilyMember, id=data['host_id'], is_host=True)
        meeting.host = host
        del data['host_id']

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
