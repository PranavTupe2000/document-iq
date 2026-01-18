from pydantic import BaseModel

class MLInferenceInput(BaseModel):
    document_id: str
    text: str

class MLInferenceOutput(BaseModel):
    document_id: str
    label: str
    confidence: float
    model_version: str
