from decimal import Decimal
from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404

from ..models import WelfareEvent, Payout, FamilyMember, Payment
from ..schemas import (
    WelfareEventCreate, WelfareEventUpdate, WelfareEventOut, WelfareEventDetailOut,
    HostContributionStatus, PaymentDetailOut, PayoutCreate, PayoutUpdate, PayoutOut,
    MessageOut,
)
from ..auth import AuthBearer

router = Router(auth=AuthBearer())

VALID_EVENT_TYPES = {'wedding', 'graduation', 'death'}
VALID_PAYOUT_STATUSES = {'pending', 'paid'}


def payout_to_out(payout: Payout) -> PayoutOut:
    return PayoutOut(
        id=payout.id,
        welfare_event_id=payout.welfare_event_id,
        amount=payout.amount,
        status=payout.status,
        paid_date=payout.paid_date,
        notes=payout.notes,
        created_at=payout.created_at,
        updated_at=payout.updated_at,
    )


def welfare_event_to_out(event: WelfareEvent) -> WelfareEventOut:
    payout = getattr(event, 'payout', None)
    return WelfareEventOut(
        id=event.id,
        member_id=event.member_id,
        member_name=event.member.name,
        event_type=event.event_type,
        date=event.date,
        contribution_expected=event.contribution_expected,
        total_contributed=event.total_contributed,
        notes=event.notes,
        payout=payout_to_out(payout) if payout else None,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("/", response=List[WelfareEventOut])
def list_welfare_events(
    request,
    member_id: Optional[int] = None,
    event_type: Optional[str] = None,
):
    """List all welfare events with optional filters."""
    queryset = WelfareEvent.objects.select_related('member', 'payout').all()
    if member_id is not None:
        queryset = queryset.filter(member_id=member_id)
    if event_type:
        queryset = queryset.filter(event_type=event_type)
    return [welfare_event_to_out(e) for e in queryset]


@router.get("/{event_id}/", response={200: WelfareEventOut, 404: MessageOut})
def get_welfare_event(request, event_id: int):
    """Get a specific welfare event by ID."""
    event = get_object_or_404(WelfareEvent.objects.select_related('member'), id=event_id)
    return welfare_event_to_out(event)


@router.post("/", response={201: WelfareEventOut, 400: MessageOut, 404: MessageOut})
def create_welfare_event(request, payload: WelfareEventCreate):
    """Create a new welfare event (wedding, graduation, or death)."""
    if payload.event_type not in VALID_EVENT_TYPES:
        return 400, {"message": "event_type must be 'wedding', 'graduation', or 'death'"}

    member = get_object_or_404(FamilyMember, id=payload.member_id)

    event = WelfareEvent.objects.create(
        member=member,
        event_type=payload.event_type,
        date=payload.date,
        contribution_expected=payload.contribution_expected,
        notes=payload.notes,
    )
    return 201, welfare_event_to_out(event)


@router.patch("/{event_id}/", response={200: WelfareEventOut, 404: MessageOut, 400: MessageOut})
def update_welfare_event(request, event_id: int, payload: WelfareEventUpdate):
    """Update a welfare event."""
    event = get_object_or_404(WelfareEvent.objects.select_related('member'), id=event_id)

    data = payload.dict(exclude_unset=True)

    if 'event_type' in data and data['event_type'] not in VALID_EVENT_TYPES:
        return 400, {"message": "event_type must be 'wedding', 'graduation', or 'death'"}

    if 'member_id' in data:
        member_id = data.pop('member_id')
        event.member = get_object_or_404(FamilyMember, id=member_id)

    for attr, value in data.items():
        setattr(event, attr, value)
    event.save()
    event.refresh_from_db()
    return welfare_event_to_out(event)


@router.delete("/{event_id}/", response={200: MessageOut, 404: MessageOut})
def delete_welfare_event(request, event_id: int):
    """Delete a welfare event (cascades its payout and recorded contributions)."""
    event = get_object_or_404(WelfareEvent, id=event_id)
    event.delete()
    return {"message": "Welfare event deleted successfully"}


@router.get("/{event_id}/detail/", response={200: WelfareEventDetailOut, 404: MessageOut})
def get_welfare_event_detail(request, event_id: int):
    """Return event info plus every active host's contribution status toward it."""
    event = get_object_or_404(WelfareEvent.objects.select_related('member'), id=event_id)

    hosts = FamilyMember.objects.filter(is_host=True, is_active=True).order_by('name')

    payments_by_member: dict[int, list[Payment]] = {}
    for p in event.contributions.select_related('member').order_by('created_at'):
        payments_by_member.setdefault(p.member_id, []).append(p)

    expected = event.contribution_expected or Decimal('0.00')

    host_statuses = []
    for host in hosts:
        host_payments = payments_by_member.get(host.id, [])
        total_paid = sum((p.amount for p in host_payments), Decimal('0.00'))
        host_statuses.append(HostContributionStatus(
            member_id=host.id,
            member_name=host.name,
            total_paid=total_paid,
            balance=expected - total_paid,
            payments=[
                PaymentDetailOut(
                    id=p.id,
                    amount=p.amount,
                    method=p.method,
                    notes=p.notes,
                    created_at=p.created_at,
                )
                for p in host_payments
            ],
        ))

    return WelfareEventDetailOut(
        **welfare_event_to_out(event).model_dump(),
        host_statuses=host_statuses,
    )


@router.post("/{event_id}/payout/", response={201: PayoutOut, 400: MessageOut, 404: MessageOut})
def create_payout(request, event_id: int, payload: PayoutCreate):
    """Record a payout from joint savings towards this event. One payout per event."""
    event = get_object_or_404(WelfareEvent, id=event_id)

    if hasattr(event, 'payout'):
        return 400, {"message": "A payout already exists for this event. Use PATCH to update it."}

    if payload.status not in VALID_PAYOUT_STATUSES:
        return 400, {"message": "status must be 'pending' or 'paid'"}

    if payload.status == 'paid' and not payload.paid_date:
        return 400, {"message": "paid_date is required when status is 'paid'"}

    payout = Payout.objects.create(
        welfare_event=event,
        amount=payload.amount,
        status=payload.status,
        paid_date=payload.paid_date,
        notes=payload.notes,
    )
    return 201, payout_to_out(payout)


@router.patch("/{event_id}/payout/", response={200: PayoutOut, 400: MessageOut, 404: MessageOut})
def update_payout(request, event_id: int, payload: PayoutUpdate):
    """Update the payout for this event, e.g. marking it paid with a date."""
    event = get_object_or_404(WelfareEvent, id=event_id)
    payout = get_object_or_404(Payout, welfare_event=event)

    data = payload.dict(exclude_unset=True)

    if 'status' in data and data['status'] not in VALID_PAYOUT_STATUSES:
        return 400, {"message": "status must be 'pending' or 'paid'"}

    new_status = data.get('status', payout.status)
    new_paid_date = data.get('paid_date', payout.paid_date)
    if new_status == 'paid' and not new_paid_date:
        return 400, {"message": "paid_date is required when status is 'paid'"}

    for attr, value in data.items():
        setattr(payout, attr, value)
    payout.save()
    return payout_to_out(payout)


@router.delete("/{event_id}/payout/", response={200: MessageOut, 404: MessageOut})
def delete_payout(request, event_id: int):
    """Remove the payout record for this event."""
    event = get_object_or_404(WelfareEvent, id=event_id)
    payout = get_object_or_404(Payout, welfare_event=event)
    payout.delete()
    return {"message": "Payout deleted successfully"}
