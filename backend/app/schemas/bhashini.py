from pydantic import BaseModel


class TranslationRequest(BaseModel):
    text: str
    target_language: str  # 'hi', 'bn', etc.


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    language: str
    provider: str = "Bhashini AI"
