import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 1. Bring the blueprint over so ESLint knows exactly what the data looks like
export interface TelemetryPoint {
    Driver: string;
    Distance: number;
    Speed: number;
    Throttle: number;
    Brake: number;
    nGear: number;
    RPM: number;
}

// 2. Strict typing for our component's inputs (No more 'any'!)
interface TelemetryChartProps {
    data: TelemetryPoint[];
    dataKey: string;
    title: string;
    domain: (string | number)[];
    drivers: string[];
}

export default function TelemetryChart({ data, dataKey, title, domain, drivers }: TelemetryChartProps) {
    const teamColors = ['#F1C40F', '#3498DB'];

    return (
        <div style={{ width: '100%', height: '250px', backgroundColor: '#1A1A1A', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#CCC' }}>{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart syncId="telemetrySync">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />

                    <XAxis dataKey="Distance" stroke="#888" type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} hide={dataKey !== "Brake"} />

                    {/* We tell TypeScript to ignore this specific line because Recharts' internal type definitions are overly strict for arrays */}
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-expect-error */}
                    <YAxis stroke="#888" domain={domain} width={40} />

                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #444', color: '#FFF' }} />

                    {drivers.map((drv: string, index: number) => (
                        <Line
                            key={drv}
                            name={drv}
                            // 3. We tell the filter exactly what 'd' is
                            data={data.filter((d: TelemetryPoint) => d.Driver === drv)}
                            type="monotone"
                            dataKey={dataKey}
                            stroke={teamColors[index % teamColors.length]}
                            dot={false}
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}