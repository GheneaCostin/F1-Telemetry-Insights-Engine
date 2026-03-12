# f1_service.py
import fastf1
import pandas as pd
import numpy as np
import os

# 1. Initialize the Cache exactly once when this service boots up
if not os.path.exists('cache'):
    os.makedirs('cache')
fastf1.Cache.enable_cache('cache')


def get_completed_races(year: int):
    """Fetches and filters the race calendar for completed events."""
    schedule = fastf1.get_event_schedule(year)

    if 'EventFormat' in schedule.columns:
        schedule = schedule[schedule['EventFormat'] != 'testing']

    now = pd.Timestamp.now().tz_localize(None)
    schedule['EventDate'] = pd.to_datetime(schedule['EventDate']).dt.tz_localize(None)
    past_races = schedule[schedule['EventDate'] <= now]

    return past_races['EventName'].tolist()


def get_race_drivers(year: int, gp: str):
    """Fetches the drivers who participated in a specific session."""
    session = fastf1.get_session(year, gp, 'R')
    session.load(telemetry=False, weather=False, messages=False)
    return session.results['Abbreviation'].dropna().tolist()


def get_lap_telemetry(year: int, gp: str, session_type: str, drivers: list, lap_number: int):
    """Fetches high-frequency telemetry for specific drivers on a specific lap."""
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True)

    laps = session.laps
    telemetry_data = []

    for driver in drivers:
        try:
            # Note: Updated to pick_drivers per the FastF1 deprecation warning we fixed earlier!
            driver_laps = laps.pick_drivers(driver)
            lap_data = driver_laps[driver_laps['LapNumber'] == lap_number]

            if lap_data.empty:
                continue

            telemetry = lap_data.get_telemetry()
            telemetry['Driver'] = driver
            telemetry_data.append(telemetry)
        except Exception as e:
            print(f"Warning: Could not load telemetry for {driver}: {e}")
            continue

    if not telemetry_data:
        return pd.DataFrame()  # Return empty if nothing found

    # Combine all drivers into one DataFrame
    combined_df = pd.concat(telemetry_data, ignore_index=True)

    # Filter only the columns the frontend needs to save bandwidth
    return combined_df[['Driver', 'Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM']]


def get_macro_session_data(year: int, gp: str, session_type: str = 'R'):
    """Calculates team aggregations and extracts a 15-sector segmented track map."""
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, weather=False, messages=False)

    if session.laps.empty:
        return {"track_map": [], "team_data": []}

    # 1. Base Map (Standard Geometry)
    fastest_single_lap = session.laps.pick_fastest()
    if pd.isna(fastest_single_lap['LapTime']):
        return {"track_map": [], "team_data": []}

    try:
        base_tel = fastest_single_lap.get_telemetry()[['X', 'Y', 'Distance', 'Speed']].dropna()
        max_dist = base_tel['Distance'].max()
        # We sample every 10th point to keep the drawing smooth but lightweight
        standard_geometry = base_tel.iloc[::10].reset_index(drop=True)
    except Exception as e:
        print(f"Base track map extraction failed: {e}")
        return {"track_map": [], "team_data": []}

    # --- THE 15 MICRO-SECTORS LOGIC ---
    NUM_SECTORS = 15
    sector_length = max_dist / NUM_SECTORS

    # 2. Extract Team Stats & Calculate Speeds for the 15 Sectors
    teams = session.laps['Team'].dropna().unique()
    team_stats = []
    team_sector_speeds = {team: {} for team in teams}

    for team in teams:
        team_laps = session.laps[session.laps['Team'] == team].pick_quicklaps()
        if team_laps.empty:
            continue

        best_team_lap = team_laps.pick_fastest()
        try:
            team_tel = best_team_lap.get_telemetry()

            # Save Overall Stats (For the Bar Charts)
            top_speed = float(team_tel['Speed'].max())
            mean_speed = float(team_tel['Speed'].mean())
            team_stats.append({
                "Team": team,
                "TopSpeed": round(top_speed, 2),
                "MeanSpeed": round(mean_speed, 2)
            })

            # Map telemetry to the 15 sectors (0 through 14)
            team_tel['StandardizedDistance'] = team_tel['Distance'] / team_tel['Distance'].max() * max_dist
            team_tel['MicroSector'] = (team_tel['StandardizedDistance'] / sector_length).astype(int).clip(
                upper=NUM_SECTORS - 1)

            # Calculate the team's average speed in each of the 15 sectors instantly
            sector_means = team_tel.groupby('MicroSector')['Speed'].mean()
            for sector_idx, speed in sector_means.items():
                team_sector_speeds[team][sector_idx] = float(speed)

        except Exception as e:
            continue

    if not team_stats:
        return {"track_map": [], "team_data": []}

    # 3. Find the Fastest Team for each of the 15 Sectors
    fastest_team_per_sector = {}
    for i in range(NUM_SECTORS):
        max_speed = -1.0
        fastest_team = "None"
        for team in teams:
            speed = team_sector_speeds[team].get(i, -1.0)
            if speed > max_speed:
                max_speed = speed
                fastest_team = team
        fastest_team_per_sector[i] = fastest_team

    # 4. Paint the track map with the 15 winning teams
    standard_geometry['MicroSector'] = (standard_geometry['Distance'] / sector_length).astype(int).clip(
        upper=NUM_SECTORS - 1)
    standard_geometry['FastestTeam'] = standard_geometry['MicroSector'].map(fastest_team_per_sector)

    # 5. Final Payload Delivery
    final_track_map_payload = standard_geometry[['X', 'Y', 'Speed', 'Distance', 'FastestTeam']]

    return {
        "track_map": final_track_map_payload.to_dict(orient='records'),
        "team_data": team_stats
    }