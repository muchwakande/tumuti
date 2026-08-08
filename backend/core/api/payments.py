from decimal import Decimal
from typing import List, Optional
from ninja import Router
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from ..models import Payment, Meeting, FamilyMember, WelfareEvent
from ..schemas import PaymentCreate, PaymentOut, PaymentSummary, MessageOut
from ..auth import AuthBearer

router = Router(auth=AuthBearer())


def payment_to_out(p: Payment) -> PaymentOut:
    target = p.target
    is_meeting = isinstance(target, Meeting)
    return PaymentOut(
        id=p.id,
        member_id=p.member_id,
        member_name=p.member.name,
        amount=p.amount,
        method=p.method,
        notes=p.notes,
        target_type="meeting" if is_meeting else "welfare_event",
        meeting_id=target.id if is_meeting else None,
        meeting_label=str(target) if is_meeting else None,
        welfare_event_id=target.id if not is_meeting else None,
        welfare_event_label=str(target) if not is_meeting else None,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("/", response=List[PaymentOut])
def list_payments(
    request,
    meeting_id: Optional[int] = None,
    welfare_event_id: Optional[int] = None,
    member_id: Optional[int] = None,
):
    """List payments with optional filters."""
    qs = Payment.objects.select_related('member', 'content_type').all()
    if meeting_id is not None:
        qs = qs.filter(content_type=ContentType.objects.get_for_model(Meeting), object_id=meeting_id)
    if welfare_event_id is not None:
        qs = qs.filter(content_type=ContentType.objects.get_for_model(WelfareEvent), object_id=welfare_event_id)
    if member_id is not None:
        qs = qs.filter(member_id=member_id)
    return [payment_to_out(p) for p in qs]


@router.get("/summary/", response=PaymentSummary)
def get_payment_summary(request, meeting_id: Optional[int] = None):
    """Aggregated payment totals for meetings. KES 200 per member goes to savings, the rest to hosts.

    Welfare event contributions are excluded — they have no savings/host split.
    """
    qs = Payment.objects.filter(content_type=ContentType.objects.get_for_model(Meeting))
    if meeting_id is not None:
        qs = qs.filter(object_id=meeting_id)

    meetings = Meeting.objects.filter(
        id__in=qs.values_list('object_id', flat=True).distinct()
    ).prefetch_related('payments')
    total_saved = sum((m.total_saved for m in meetings), Decimal('0.00'))
    total_collected = sum((p.amount for p in qs), Decimal('0.00'))
    total_to_host = total_collected - total_saved

    return PaymentSummary(
        total_collected=total_collected,
        total_saved=total_saved,
        total_to_host=total_to_host,
        payment_count=qs.count(),
    )


@router.get("/{payment_id}/", response={200: PaymentOut, 404: MessageOut})
def get_payment(request, payment_id: int):
    """Get a single payment by ID."""
    p = get_object_or_404(Payment.objects.select_related('member', 'content_type'), id=payment_id)
    return payment_to_out(p)


@router.post("/", response={201: PaymentOut, 400: MessageOut, 404: MessageOut})
def create_payment(request, payload: PaymentCreate):
    """Record a new payment for a member, against exactly one of a meeting or a welfare event."""
    if payload.method not in ('cash', 'mpesa'):
        return 400, {"message": "Method must be 'cash' or 'mpesa'"}

    if bool(payload.meeting_id) == bool(payload.welfare_event_id):
        return 400, {"message": "Provide exactly one of meeting_id or welfare_event_id"}

    member = get_object_or_404(FamilyMember, id=payload.member_id)

    if payload.meeting_id:
        target = get_object_or_404(Meeting, id=payload.meeting_id)
    else:
        target = get_object_or_404(WelfareEvent, id=payload.welfare_event_id)

    payment = Payment.objects.create(
        content_type=ContentType.objects.get_for_model(target),
        object_id=target.id,
        member=member,
        amount=payload.amount,
        method=payload.method,
        notes=payload.notes,
    )
    payment.refresh_from_db()
    return 201, payment_to_out(payment)


@router.delete("/{payment_id}/", response={200: MessageOut, 404: MessageOut})
def delete_payment(request, payment_id: int):
    """Delete a payment record."""
    payment = get_object_or_404(Payment, id=payment_id)
    payment.delete()
    return {"message": "Payment deleted successfully"}
