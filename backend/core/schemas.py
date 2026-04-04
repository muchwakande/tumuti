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


class MeetingOut(BaseModel):
    id: int
    year: int
    month: int
    date: date
    host_id: int
    host_name: str
    status: str
    savings_percentage: Decimal
    total_contributions: Decimal
    total_saved: Decimal
    total_to_host: Decimal
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Contribution Schemas
class ContributionBase(BaseModel):
    meeting_id: int
    member_id: int
    amount: Decimal = Field(..., gt=0)
    notes: str = ""
    date: date


class ContributionCreate(ContributionBase):
    pass


class ContributionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    notes: Optional[str] = None
    date: Optional[date] = None


class ContributionOut(BaseModel):
    id: int
    meeting_id: int
    member_id: int
    member_name: str
    amount: Decimal
    saved_amount: Decimal
    host_amount: Decimal
    notes: str
    date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
    total_contributions_count: int
    total_savings: Decimal
    next_meeting: Optional[MeetingOut]


class ContributionSummary(BaseModel):
    total_amount: Decimal
    total_saved: Decimal
    total_to_host: Decimal
    contribution_count: int


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
