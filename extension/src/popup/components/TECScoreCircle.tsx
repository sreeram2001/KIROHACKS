interface TECScoreCircleProps {
    tec: number;
    listedPrice: number;
    size?: number;
}

export default function TECScoreCircle({ tec, listedPrice, size = 44 }: TECScoreCircleProps) {
    const score = Math.max(0, Math.min(100, Math.round(100 - ((tec - listedPrice) / listedPrice) * 100)));

    let color: string;
    if (score >= 70) {
        color = "#14b8a6";
    } else if (score >= 50) {
        color = "#eab308";
    } else {
        color = "#ef4444";
    }

    const strokeWidth = size >= 40 ? 3.5 : 2.5;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (score / 100) * circumference;
    const center = size / 2;
    const fontSize = size >= 40 ? 14 : 11;

    return (
        <svg width={size} height={size} style={{ display: "block" }}>
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={fontSize}
                fontWeight={700}
            >
                {score}
            </text>
        </svg>
    );
}
