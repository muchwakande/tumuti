from decimal import Decimal
from typing import List, Optional
from ninja import Router
from django.shortcuts import get_object_or_404

from ..models import Payment, Meeting, FamilyMember
from ..schemas import PaymentCreate, PaymentOut, PaymentSummary, MessageOut
from ..auth import AuthBearer

router = Router(auth=AuthBearer())


def payment_to_out(p: Payment) -> PaymentOut:
    return PaymentOut(
        id=p.id,
        meeting_id=p.meeting_id,
        meeting_label=str(p.meeting),
        member_id=p.member_id,
        member_name=p.member.name,
        amount=p.amount,
        method=p.method,
        notes=p.notes,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("/", response=List[PaymentOut])
def list_payments(
    request,
    meeting_id: Optional[int] = None,
    member_id: Optional[int] = None,
):
    """List payments with optional filters."""
    qs = Payment.objects.select_related('member', 'meeting__host').all()
    if meeting_id is not None:
        qs = qs.filter(meeting_id=meeting_id)
    if member_id is not None:
        qs = qs.filter(member_id=member_id)
    return [payment_to_out(p) for p in qs]


@router.get("/summary/", response=PaymentSummary)
def get_payment_summary(request, meeting_id: Optional[int] = None):
    """Aggregated payment totals. Savings split is derived from each meeting's savings_percentage."""
    qs = Payment.objects.select_related('meeting').all()
    if meeting_id is not None:
        qs = qs.filter(meeting_id=meeting_id)

    payments = list(qs)
    total_collected = sum((p.amount for p in payments), Decimal('0.00'))
    total_saved = sum(
        (p.amount * p.meeting.savings_percentage / Decimal('100')).quantize(Decimal('0.01'))
        for p in payments
    )
    total_to_host = total_collected - total_saved

    return PaymentSummary(
        total_collected=total_collected,
        total_saved=total_saved,
        total_to_host=total_to_host,
        payment_count=len(payments),
    )


@router.get("/{payment_id}/", response={200: PaymentOut, 404: MessageOut})
def get_payment(request, payment_id: int):
    """Get a single payment by ID."""
    p = get_object_or_404(Payment.objects.select_related('member', 'meeting'), id=payment_id)
    return payment_to_out(p)


@router.post("/", response={201: PaymentOut, 400: MessageOut, 404: MessageOut})
def create_payment(request, payload: PaymentCreate):
    """Record a new payment for a member at a meeting."""
    if payload.method not in ('cash', 'mpesa'):
        return 400, {"message": "Method must be 'cash' or 'mpesa'"}

    meeting = get_object_or_404(Meeting, id=payload.meeting_id)
    member = get_object_or_404(FamilyMember, id=payload.member_id)

    payment = Payment.objects.create(
        meeting=meeting,
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
