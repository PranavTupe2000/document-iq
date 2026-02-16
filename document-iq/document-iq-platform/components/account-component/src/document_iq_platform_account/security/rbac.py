from fastapi import Depends, HTTPException
from document_iq_platform_account.security.dependencies import get_current_user


def require_role(required_role: str):
    def role_checker(user=Depends(get_current_user)):
        if user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return role_checker
