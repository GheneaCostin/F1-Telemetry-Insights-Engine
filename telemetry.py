# telemetry.py
import pandas as pd
import fastf1
from datetime import datetime


def get_telemetry_for_drivers(laps_df, drivers, lap_number):
    """
    Extracts telemetry data for specific drivers on a specific lap.
    Returns a combined pandas DataFrame.
    """
    telemetry_data = []

    for driver in drivers:
        try:
            # FastF1's built-in filtering (much faster than custom loops)
            driver_laps = laps_df.pick_drivers(driver)

            # Find the specific lap
            lap = driver_laps[driver_laps['LapNumber'] == lap_number].iloc[0]

            # Load the telemetry for that lap
            telemetry = lap.get_telemetry()

            # Add a driver column so the frontend knows who is who
            telemetry['Driver'] = driver
            telemetry_data.append(telemetry)

        except IndexError:
            # This handles cases where a driver DNF'd before the requested lap
            continue

    if telemetry_data:
        return pd.concat(telemetry_data, ignore_index=True)

    return pd.DataFrame()  # Return empty if no data found