from ninja import Router
from django.contrib.auth.models import User

from ..schemas import LoginIn, TokenOut, MessageOut
from ..auth import authenticate_user, create_access_token

router = Router()


@router.post("/login/", response={200: TokenOut, 401: MessageOut})
def login(request, payload: LoginIn):
    """Login and get access token."""
    user = authenticate_user(payload.username, payload.password)
    if not user:
        return 401, {"message": "Invalid credentials"}

    access_token = create_access_token(user.id)
    return 200, {"access_token": access_token, "token_type": "bearer"}
