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
    host_id: int
    status: str = "scheduled"
    savings_percentage: Decimal = Field(default=Decimal('30.00'), ge=0, le=100)
    notes: str = ""


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    date: Optional[date] = None
    host_id: Optional[int] = None
    status: Optional[str] = None
    savings_percentage: Optional[Decimal] = None
    notes: Optional[str] = None
    minutes: Optional[str] = None


class MeetingOut(BaseModel):
    id: int
    year: int
    month: int
    date: date
    host_id: int
    host_name: str
    status: str
    savings_percentage: Decimal
    expected_contribution: Decimal
    total_collected: Decimal
    total_saved: Decimal
    total_to_host: Decimal
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
    attended: bool
    total_paid: Decimal
    balance: Decimal
    payments: List[PaymentDetailOut]


class MeetingDetailOut(MeetingOut):
    member_statuses: List[MemberStatusOut]


# Payment Schemas
class PaymentCreate(BaseModel):
    meeting_id: int
    member_id: int
    amount: Decimal = Field(..., gt=0)
    method: str = "cash"
    notes: str = ""


class PaymentOut(BaseModel):
    id: int
    meeting_id: int
    meeting_label: str
    member_id: int
    member_name: str
    amount: Decimal
    method: str
    notes: str
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
