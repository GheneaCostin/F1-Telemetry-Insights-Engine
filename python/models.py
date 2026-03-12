# models.py
from pydantic import BaseModel
from typing import List, Optional

class SessionRequest(BaseModel):
    year: int
    gp: str
    session_type: str = "R"

class TelemetryRequest(SessionRequest):
    drivers: List[str]
    lap_number: int


class TrackPointModel(BaseModel):
    X: float
    Y: float
    Speed: float
    Distance: float
    FastestTeam: str

class TeamStatModel(BaseModel):
    Team: str
    TopSpeed: float
    MeanSpeed: float

class MacroSessionResponse(BaseModel):
    track_map: List[TrackPointModel]
    team_data: List[TeamStatModel]