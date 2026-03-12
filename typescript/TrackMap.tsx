// TrackMap.tsx
import {
    ScatterChart, Scatter, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, ReferenceDot
} from 'recharts';
import type {ValueType , NameType} from "recharts/types/component/DefaultTooltipContent";


export interface TrackPoint {
    X: number;
    Y: number;
    Speed: number;
    Distance: number;
    FastestTeam: string;
}

interface TrackMapProps {
    data: TrackPoint[];
}


interface MapSegment {
    points: TrackPoint[];
    color: string;
    team: string;
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
    "Haas F1 Team": "#B6BABD",
    "None": "#333333"
};


function preprocessMapDataToSegments(data: TrackPoint[]): MapSegment[] {
    const segments: MapSegment[] = [];
    if (!data || data.length === 0) return segments;

    let currentSegmentPoints: TrackPoint[] = [];
    let currentTeam = data[0].FastestTeam;
    let currentColor = teamColors[currentTeam] || "#FFFFFF";

    data.forEach((point, index) => {

        currentSegmentPoints.push(point);

        const teamChanged = point.FastestTeam !== currentTeam;
        const isLastPoint = index === data.length - 1;

        if (teamChanged || isLastPoint) {
            segments.push({
                points: currentSegmentPoints,
                color: currentColor,
                team: currentTeam
            });

            if (teamChanged && !isLastPoint) {
                currentSegmentPoints = [point];
                currentTeam = point.FastestTeam;
                currentColor = teamColors[currentTeam] || "#FFFFFF";
            } else if (isLastPoint) {
                // We just added the last segment, no need to reset
            }
        }
    });

    return segments;
}

export default function TrackMap({ data }: TrackMapProps) {
    if (!data || data.length === 0) return null;


    const mapSegments = preprocessMapDataToSegments(data);

    return (
        <div style={{ width: '100%', height: '400px', backgroundColor: '#1A1A1A', padding: '15px', borderRadius: '8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#CCC', alignSelf: 'flex-start' }}>Circuit layout (Colored by Fastest Team Δ)</h4>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
                    <XAxis type="number" dataKey="X" domain={['dataMin', 'dataMax']} hide />
                    <YAxis type="number" dataKey="Y" domain={['dataMin', 'dataMax']} hide />

                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                            backgroundColor: '#111',
                            borderColor: '#444',
                            color: '#FFF',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        // FIX: Use 'unknown' instead of 'any' to satisfy ESLint
                        formatter={(value: ValueType | undefined, name: NameType | undefined, item: unknown) => {
                            // Safe type check: Ensure item is an object and has a payload of our type
                            const itemObj = item as { payload?: TrackPoint };
                            const point = itemObj?.payload;

                            if (value !== undefined && point) {
                                const teamName = point.FastestTeam;
                                const teamColor = teamColors[teamName] || "#FFF";

                                return [
                                    <span key="team-name" style={{ color: teamColor, fontWeight: 'bold' }}>
                    {teamName}
                </span>,
                                    `Speed: ${Number(value).toFixed(1)} km/h`
                                ];
                            }
                            return [value?.toString() ?? "N/A", name ?? "Data"];
                        }}
                        labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                                return `Circuit Position`;
                            }
                            return "Telemetry";
                        }}
                    />

                    <Legend verticalAlign="top" height={36} iconType="circle" />


                    <ReferenceDot
                        x={data[0].X}
                        y={data[0].Y}
                        r={6}
                        fill="#FFFFFF"
                        stroke="#000"
                        strokeWidth={2}
                        label={{ position: 'top', value: 'START', fill: '#FFF', fontSize: 10 }}
                    />

                    {mapSegments.map((segment, index) => (
                        <Scatter
                            key={`segment-${index}`}
                            name={segment.team}
                            data={segment.points}
                            fill={segment.color}
                            line
                            shape="circle"
                        />
                    ))}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}