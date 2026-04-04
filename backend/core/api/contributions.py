from decimal import Decimal
from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count

from ..models import Contribution, Meeting, FamilyMember
from ..schemas import ContributionCreate, ContributionUpdate, ContributionOut, ContributionSummary, MessageOut
from ..auth import AuthBearer

router = Router(auth=AuthBearer())


def contribution_to_out(c: Contribution) -> ContributionOut:
    return ContributionOut(
        id=c.id,
        meeting_id=c.meeting_id,
        member_id=c.member_id,
        member_name=c.member.name,
        amount=c.amount,
        saved_amount=c.saved_amount,
        host_amount=c.host_amount,
        notes=c.notes,
        date=c.date,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.get("/", response=List[ContributionOut])
def list_contributions(
    request,
    meeting_id: Optional[int] = None,
    member_id: Optional[int] = None,
):
    """List all contributions with optional filters."""
    queryset = Contribution.objects.select_related('member', 'meeting').all()
    if meeting_id is not None:
        queryset = queryset.filter(meeting_id=meeting_id)
    if member_id is not None:
        queryset = queryset.filter(member_id=member_id)
    return [contribution_to_out(c) for c in queryset]


@router.get("/summary/", response=ContributionSummary)
def get_contribution_summary(request, meeting_id: Optional[int] = None):
    """Get summary of contributions."""
    queryset = Contribution.objects.all()
    if meeting_id is not None:
        queryset = queryset.filter(meeting_id=meeting_id)

    agg = queryset.aggregate(
        total_amount=Sum('amount'),
        total_saved=Sum('saved_amount'),
        total_to_host=Sum('host_amount'),
        contribution_count=Count('id'),
    )

    return {
        "total_amount": agg['total_amount'] or Decimal('0.00'),
        "total_saved": agg['total_saved'] or Decimal('0.00'),
        "total_to_host": agg['total_to_host'] or Decimal('0.00'),
        "contribution_count": agg['contribution_count'] or 0,
    }


@router.get("/{contribution_id}/", response={200: ContributionOut, 404: MessageOut})
def get_contribution(request, contribution_id: int):
    """Get a specific contribution by ID."""
    c = get_object_or_404(Contribution.objects.select_related('member', 'meeting'), id=contribution_id)
    return contribution_to_out(c)


@router.post("/", response={201: ContributionOut, 400: MessageOut, 404: MessageOut})
def create_contribution(request, payload: ContributionCreate):
    """Create a new contribution. Member must be a host."""
    meeting = get_object_or_404(Meeting, id=payload.meeting_id)
    member = get_object_or_404(FamilyMember, id=payload.member_id, is_host=True)

    if Contribution.objects.filter(meeting=meeting, member=member).exists():
        return 400, {"message": "This member has already contributed to this meeting"}

    contribution = Contribution(
        meeting=meeting,
        member=member,
        amount=payload.amount,
        notes=payload.notes,
        date=payload.date,
    )
    contribution.save()  # save() calculates saved_amount and host_amount
    contribution.refresh_from_db()
    contribution.member  # ensure related object is loaded
    return 201, contribution_to_out(contribution)


@router.patch("/{contribution_id}/", response={200: ContributionOut, 404: MessageOut})
def update_contribution(request, contribution_id: int, payload: ContributionUpdate):
    """Update a contribution."""
    contribution = get_object_or_404(
        Contribution.objects.select_related('member', 'meeting'),
        id=contribution_id,
    )

    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(contribution, attr, value)
    contribution.save()  # recalculates saved/host amounts
    contribution.refresh_from_db()
    return contribution_to_out(contribution)


@router.delete("/{contribution_id}/", response={200: MessageOut, 404: MessageOut})
def delete_contribution(request, contribution_id: int):
    """Delete a contribution."""
    contribution = get_object_or_404(Contribution, id=contribution_id)
    contribution.delete()
    return {"message": "Contribution deleted successfully"}
