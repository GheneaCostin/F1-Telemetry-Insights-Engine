import { useState, useEffect } from 'react';
import axios from 'axios';
import TelemetryChart from './TelemetryChart';
import TrackMap, { type TrackPoint } from './TrackMap';
import TeamPerformanceChart, { type TeamStat } from './TeamPerformanceChart';
import TeamDeltaCharts from './TeamDeltaCharts';

// 1. The blueprint for what our React state expects
interface TelemetryPoint {
    Driver: string;
    Distance: number;
    Speed: number;
    Throttle: number;
    Brake: number;
    nGear: number;
    RPM: number;
}

// 2. The blueprint for what the API actually sends
interface RawTelemetryPoint {
    Driver: string;
    Distance: number;
    Speed: number;
    Throttle: number;
    Brake: boolean | number;
    nGear: number;
    RPM: number;
}

function App() {
    // --- KUBERNETES CONFIGURATION ---
    // If .env is present, it uses localhost:30001. Otherwise, it falls back to your local dev port.
    const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/gateway';

    const [data, setData] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const availableYears = Array.from(new Array(new Date().getFullYear() - 2018 + 1), (_, i) => new Date().getFullYear() - i);

    const [year, setYear] = useState<number>(2024);
    const [availableGPs, setAvailableGPs] = useState<string[]>([]);
    const [gp, setGp] = useState<string>("");

    const [trackMapData, setTrackMapData] = useState<TrackPoint[]>([]);
    const [teamData, setTeamData] = useState<TeamStat[]>([]);
    const [loadingMacro, setLoadingMacro] = useState(false);

    const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    const [driver1, setDriver1] = useState("VER");
    const [driver2, setDriver2] = useState("NOR");
    const [lap, setLap] = useState<number>(10);
    const [activeDrivers, setActiveDrivers] = useState<string[]>([]);

    // Fetch the calendar whenever the year changes
    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const response = await axios.get(`${API_BASE}/races/${year}`);
                if (response.data && response.data.races) {
                    setAvailableGPs(response.data.races);
                    setGp(response.data.races[0]);
                }
            } catch (error) {
                console.error("Failed to fetch calendar:", error);
            }
        };
        fetchCalendar();
    }, [year, API_BASE]);

    // Fetch drivers whenever the year or GP changes
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!gp) return;
            setLoadingDrivers(true);
            try {
                const response = await axios.get(`${API_BASE}/drivers/${year}/${gp}`);
                if (response.data && response.data.drivers) {
                    setAvailableDrivers(response.data.drivers);
                    setDriver1(response.data.drivers[0] || "");
                    setDriver2(response.data.drivers[1] || "");
                }
            } catch (error) {
                console.error("Failed to fetch drivers:", error);
            } finally {
                setLoadingDrivers(false);
            }
        };
        fetchDrivers();
    }, [year, gp, API_BASE]);

    const fetchTelemetry = async () => {
        if (!gp) return;
        setLoading(true);
        try {
            const driversToFetch = [driver1.trim().toUpperCase(), driver2.trim().toUpperCase()].filter(Boolean);

            const response = await axios.post(`${API_BASE}/telemetry`, {
                year: year,
                gp: gp,
                session_type: "R",
                drivers: driversToFetch,
                lap_number: lap
            });

            const formattedData = response.data.map((point: RawTelemetryPoint) => ({
                ...point,
                Brake: point.Brake ? 100 : 0
            }));

            setData(formattedData);
            setActiveDrivers(driversToFetch);
        } catch (error) {
            console.error("Telemetry link failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMacroData = async () => {
        if (!gp) return;
        setLoadingMacro(true);
        try {
            const response = await axios.get(`${API_BASE}/macro/${year}/${gp}`);
            if (response.data) {
                setTrackMapData(response.data.track_map || []);
                setTeamData(response.data.team_data || []);
            }
        } catch (error) {
            console.error("Failed to fetch macro data:", error);
        } finally {
            setLoadingMacro(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0A0A0A', color: '#FFF', fontFamily: 'sans-serif' }}>

            {/* SIDEBAR */}
            <div style={{ width: '300px', minWidth: '300px', padding: '20px', backgroundColor: '#111', borderRight: '1px solid #333', boxSizing: 'border-box' }}>
                <h2 style={{ color: '#ED1B24', borderBottom: '1px solid #333', paddingBottom: '10px' }}>RBR Pit Wall</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' }}>SEASON</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' }}>GRAND PRIX</label>
                        <select value={gp} onChange={(e) => setGp(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }} disabled={availableGPs.length === 0}>
                            {availableGPs.map(race => (
                                <option key={race} value={race}>{race}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ borderTop: '1px solid #333', margin: '5px 0' }}></div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                            DRIVER 1 (Yellow) {loadingDrivers && "(Loading...)"}
                        </label>
                        <select value={driver1} onChange={(e) => setDriver1(e.target.value)} disabled={loadingDrivers} style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}>
                            {availableDrivers.map(drv => (
                                <option key={`d1-${drv}`} value={drv}>{drv}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                            DRIVER 2 (Blue)
                        </label>
                        <select value={driver2} onChange={(e) => setDriver2(e.target.value)} disabled={loadingDrivers} style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }}>
                            <option value="">-- None (Single Driver) --</option>
                            {availableDrivers.map(drv => (
                                <option key={`d2-${drv}`} value={drv}>{drv}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' }}>LAP NUMBER</label>
                        <input type="number" value={lap} onChange={(e) => setLap(Number(e.target.value))} style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#FFF', border: '1px solid #444', borderRadius: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <button onClick={fetchTelemetry} disabled={loading} style={{ padding: '12px', width: '100%', backgroundColor: loading ? '#555' : '#001A9B', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                        {loading ? "FETCHING..." : "COMPARE TELEMETRY"}
                    </button>

                    <button onClick={fetchMacroData} disabled={loadingMacro} style={{ padding: '12px', width: '100%', backgroundColor: loadingMacro ? '#555' : '#E67E22', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingMacro ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                        {loadingMacro ? "FETCHING MACRO..." : "LOAD SESSION MACRO"}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, minWidth: 0, padding: '20px', overflowY: 'auto', boxSizing: 'border-box' }}>

                {trackMapData.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <TrackMap data={trackMapData} />
                    </div>
                )}

                {teamData.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <TeamPerformanceChart data={teamData} />
                    </div>
                )}

                {teamData.length > 0 && (
                    <TeamDeltaCharts data={teamData} />
                )}

                {data.length === 0 && !loading ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                        <h2>Select a track and enter drivers to load telemetry.</h2>
                    </div>
                ) : (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <TelemetryChart data={data} drivers={activeDrivers} dataKey="Speed" title="Speed (km/h)" domain={['auto', 'auto']} />
                        <TelemetryChart data={data} drivers={activeDrivers} dataKey="Throttle" title="Throttle (%)" domain={[0, 100]} />
                        <TelemetryChart data={data} drivers={activeDrivers} dataKey="Brake" title="Brake" domain={[0, 100]} />
                        <TelemetryChart data={data} drivers={activeDrivers} dataKey="nGear" title="Gear" domain={[1, 8]} />
                        <TelemetryChart data={data} drivers={activeDrivers} dataKey="RPM" title="Engine RPM" domain={['auto', 'auto']} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;