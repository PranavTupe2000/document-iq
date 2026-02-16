from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterOrganizationRequest(BaseModel):
    organization_name: str
    admin_email: EmailStr
    admin_password: str


class RegisterUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # USER only allowed via API
