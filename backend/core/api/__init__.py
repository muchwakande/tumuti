from ninja import NinjaAPI
from ninja.errors import ValidationError
from django.http import HttpRequest

from .auth import router as auth_router
from .members import router as members_router
from .meetings import router as meetings_router
from .contributions import router as contributions_router


api = NinjaAPI(
    title="Family Reunion API",
    version="1.0.0",
    description="API for managing family reunion members, meetings, and contributions",
)


@api.exception_handler(ValidationError)
def validation_errors(request: HttpRequest, exc: ValidationError):
    return api.create_response(
        request,
        {"detail": exc.errors},
        status=400,
    )


api.add_router("/auth", auth_router, tags=["Authentication"])
api.add_router("/members", members_router, tags=["Members"])
api.add_router("/meetings", meetings_router, tags=["Meetings"])
api.add_router("/contributions", contributions_router, tags=["Contributions"])
