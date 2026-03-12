import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { type TeamStat } from './TeamPerformanceChart';

interface Props {
    data: TeamStat[];
}

const teamColors: Record<string, string> = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#0093CC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD"
};

export default function TeamDeltaCharts({ data }: Props) {
    if (!data || data.length === 0) return null;

    // 1. Calculate the Grid Averages
    const avgTopSpeed = data.reduce((sum, team) => sum + team.TopSpeed, 0) / data.length;
    const avgMeanSpeed = data.reduce((sum, team) => sum + team.MeanSpeed, 0) / data.length;

    // 2. Map the data to include Deltas and sort them from fastest to slowest
    const deltaData = data.map(team => ({
        ...team,
        TopDelta: Number((team.TopSpeed - avgTopSpeed).toFixed(2)),
        MeanDelta: Number((team.MeanSpeed - avgMeanSpeed).toFixed(2))
    }));

    const sortedByTop = [...deltaData].sort((a, b) => b.TopDelta - a.TopDelta);
    const sortedByMean = [...deltaData].sort((a, b) => b.MeanDelta - a.MeanDelta);

    return (
        <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>

            {/* LEFT CHART: Top Speed Delta */}
            <div style={{ flex: 1, height: '400px', backgroundColor: '#1A1A1A', padding: '15px', borderRadius: '8px', boxSizing: 'border-box' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#CCC', textAlign: 'center' }}>Team Top Speed Delta (Δ)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={sortedByTop} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis type="number" stroke="#888" domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis dataKey="Team" type="category" stroke="#888" width={100} style={{ fontSize: '12px' }} />
                        <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#000', borderColor: '#444', color: '#FFF' }} />
                        <Bar dataKey="TopDelta" name="Δ to Session Avg (km/h)">
                            {sortedByTop.map((entry, index) => (
                                <Cell key={`cell-top-${index}`} fill={teamColors[entry.Team] || "#888"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* RIGHT CHART: Mean Speed Delta */}
            <div style={{ flex: 1, height: '400px', backgroundColor: '#1A1A1A', padding: '15px', borderRadius: '8px', boxSizing: 'border-box' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#CCC', textAlign: 'center' }}>Team Mean Speed Delta (Δ)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={sortedByMean} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis type="number" stroke="#888" domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis dataKey="Team" type="category" stroke="#888" width={100} style={{ fontSize: '12px' }} />
                        <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#000', borderColor: '#444', color: '#FFF' }} />
                        <Bar dataKey="MeanDelta" name="Δ to Session Avg (km/h)">
                            {sortedByMean.map((entry, index) => (
                                <Cell key={`cell-mean-${index}`} fill={teamColors[entry.Team] || "#888"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}