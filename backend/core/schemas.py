from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


# Family Member Schemas
class FamilyMemberBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    is_host: bool = False
    parent_id: Optional[int] = None
    spouse_id: Optional[int] = None
    is_active: bool = True
    notes: str = ""


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_host: Optional[bool] = None
    parent_id: Optional[int] = None
    spouse_id: Optional[int] = None
    clear_spouse: bool = False
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class FamilyMemberOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: str
    is_host: bool
    parent_id: Optional[int]
    spouse_id: Optional[int]
    spouse_name: Optional[str]
    is_active: bool
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyMemberTreeOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: str
    is_host: bool
    is_active: bool
    parent_id: Optional[int]
    spouse_id: Optional[int]
    spouse_name: Optional[str]
    children: List['FamilyMemberTreeOut'] = []

    class Config:
        from_attributes = True


FamilyMemberTreeOut.model_rebuild()


# Meeting Schemas
class MeetingBase(BaseModel):
    year: int
    month: int = Field(..., description="4=April, 8=August, 12=December")
    date: date
    host_ids: List[int]
    status: str = "scheduled"
    notes: str = ""


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    date: Optional[date] = None
    host_ids: Optional[List[int]] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    minutes: Optional[str] = None


class HostArrearsOut(BaseModel):
    member_id: int
    member_name: str
    balance: Decimal


class MeetingOut(BaseModel):
    id: int
    year: int
    month: int
    date: date
    host_ids: List[int]
    host_names: List[str]
    status: str
    expected_contribution: Decimal
    total_collected: Decimal
    total_saved: Decimal
    total_to_host: Decimal
    host_arrears: List[HostArrearsOut]
    notes: str
    minutes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Meeting Detail Schemas
class PaymentDetailOut(BaseModel):
    id: int
    amount: Decimal
    method: str
    notes: str
    created_at: datetime


class MemberStatusOut(BaseModel):
    member_id: int
    member_name: str
    member_phone: str
    is_host: bool
    is_meeting_host: bool
    attended: bool
    total_paid: Decimal
    balance: Decimal
    payments: List[PaymentDetailOut]


class MeetingDetailOut(MeetingOut):
    member_statuses: List[MemberStatusOut]


# Payout Schemas
class PayoutCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    status: str = "pending"
    paid_date: Optional[date] = None
    notes: str = ""


class PayoutUpdate(BaseModel):
    amount: Optional[Decimal] = None
    status: Optional[str] = None
    paid_date: Optional[date] = None
    notes: Optional[str] = None


class PayoutOut(BaseModel):
    id: int
    welfare_event_id: int
    amount: Decimal
    status: str
    paid_date: Optional[date]
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Welfare Event Schemas
class WelfareEventBase(BaseModel):
    member_id: int
    event_type: str = Field(..., description="wedding, graduation, or death")
    date: date
    contribution_expected: Optional[Decimal] = None
    notes: str = ""


class WelfareEventCreate(WelfareEventBase):
    pass


class WelfareEventUpdate(BaseModel):
    member_id: Optional[int] = None
    event_type: Optional[str] = None
    date: Optional[date] = None
    contribution_expected: Optional[Decimal] = None
    notes: Optional[str] = None


class WelfareEventOut(BaseModel):
    id: int
    member_id: int
    member_name: str
    event_type: str
    date: date
    contribution_expected: Optional[Decimal]
    total_contributed: Decimal
    notes: str
    payout: Optional[PayoutOut] = None
    created_at: datetime
    updated_at: datetime


class HostContributionStatus(BaseModel):
    member_id: int
    member_name: str
    total_paid: Decimal
    balance: Decimal
    payments: List[PaymentDetailOut]


class WelfareEventDetailOut(WelfareEventOut):
    host_statuses: List[HostContributionStatus]


# Payment Schemas
class PaymentCreate(BaseModel):
    member_id: int
    amount: Decimal = Field(..., gt=0)
    method: str = "cash"
    notes: str = ""
    meeting_id: Optional[int] = None
    welfare_event_id: Optional[int] = None


class PaymentOut(BaseModel):
    id: int
    member_id: int
    member_name: str
    amount: Decimal
    method: str
    notes: str
    target_type: str = Field(..., description="'meeting' or 'welfare_event'")
    meeting_id: Optional[int] = None
    meeting_label: Optional[str] = None
    welfare_event_id: Optional[int] = None
    welfare_event_label: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentSummary(BaseModel):
    total_collected: Decimal
    total_saved: Decimal
    total_to_host: Decimal
    payment_count: int


# Auth Schemas
class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    username: str
    password: str


# Summary Schemas
class DashboardSummary(BaseModel):
    total_members: int
    active_hosts: int
    payment_count: int
    total_collected: Decimal
    next_meeting: Optional[MeetingOut]


# Message Schema
class MessageOut(BaseModel):
    message: str


class BulkUploadError(BaseModel):
    row: int
    message: str


class BulkUploadResult(BaseModel):
    created_count: int
    skipped_count: int
    errors: List[BulkUploadError]
