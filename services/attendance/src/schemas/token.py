from pydantic import BaseModel
from uuid import UUID

class Token(BaseModel):
    userUuid: UUID
    expires: float
    isStaff: bool
