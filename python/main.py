# main.py
from fastapi import FastAPI, HTTPException
from models import TelemetryRequest
import f1_service

app = FastAPI(title="Red Bull Racing - Telemetry Data Engine")

@app.get("/")
def read_root():
    return {"status": "F1 Data Engine is Online and Modularized."}

@app.get("/api/v1/races/{year}")
def get_races(year: int):
    try:
        races = f1_service.get_completed_races(year)
        return {"races": races}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/drivers/{year}/{gp}")
def get_drivers(year: int, gp: str):
    try:
        drivers = f1_service.get_race_drivers(year, gp)
        return {"drivers": drivers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/macro/{year}/{gp}")
def get_macro_data(year: int, gp: str):
    """Endpoint for the Full Session Analysis Dashboard."""
    try:
        # Defaulting to Race ('R') session for the macro analysis
        data = f1_service.get_macro_session_data(year, gp, 'R')
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/telemetry")
def get_telemetry(req: TelemetryRequest):
    try:
        telemetry_df = f1_service.get_lap_telemetry(
            year=req.year,
            gp=req.gp,
            session_type=req.session_type,
            drivers=req.drivers,
            lap_number=req.lap_number
        )

        if telemetry_df.empty:
            raise HTTPException(status_code=404, detail="No telemetry found for these parameters.")

        return telemetry_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))