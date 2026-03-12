import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

export interface TeamStat {
    Team: string;
    TopSpeed: number;
    MeanSpeed: number;
}

interface Props {
    data: TeamStat[];
}

// Official F1 Team Colors
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

export default function TeamPerformanceChart({ data }: Props) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1A1A1A', padding: '15px', borderRadius: '8px', boxSizing: 'border-box', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#CCC' }}>Top vs Mean Speed (km/h)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />

                    {/* X-Axis: Mean Speed (Overall Pace) */}
                    <XAxis type="number" dataKey="MeanSpeed" name="Mean Speed" domain={['auto', 'auto']} stroke="#888" label={{ value: 'Mean Speed (km/h)', position: 'insideBottom', offset: -10, fill: '#888' }} />

                    {/* Y-Axis: Top Speed (Straight Line Speed) */}
                    <YAxis type="number" dataKey="TopSpeed" name="Top Speed" domain={['auto', 'auto']} stroke="#888" label={{ value: 'Top Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#888' }} />

                    {/* Z-Axis controls the dot size. We keep it static here so they are all the same size */}
                    <ZAxis type="number" range={[100, 100]} />

                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#000', borderColor: '#444', color: '#FFF' }}
                        formatter={(value: number | string | readonly (number | string)[] | undefined, name: string | number | undefined) => {
                            const safeValue = Array.isArray(value) ? value[0] : value;
                            return [Number(safeValue).toFixed(2), String(name)];
                        }}
                    />

                    <Scatter name="Teams" data={data}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={teamColors[entry.Team] || "#FFFFFF"} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}