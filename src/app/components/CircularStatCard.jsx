"use client";

export default function CircularStatCard({
  title,
  value,
  color,
  subtitle,
}) {
  const radius = 42;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-6 flex flex-col items-center justify-center gap-3">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>

      <svg height={radius * 2} width={radius * 2}>
        {/* Background circle */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="dark:stroke-gray-700"
        />

        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}%
      </p>

      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {subtitle}
        </p>
      )}
    </div>
  );
}
