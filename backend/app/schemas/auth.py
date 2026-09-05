from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str
    role: str


class UserLogin(BaseModel):
    identifier: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str
    role: str

    class Config:
        from_attributes = True
