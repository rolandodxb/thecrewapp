interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
}

export default function ProgressBar({
  current,
  max,
  label,
  showPercentage = true,
  color = 'bg-[#D71920]'
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-gray-600">
              {current} / {max} ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
