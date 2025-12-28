import { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, icon, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            aria-label="Chiudi"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  gradient: string;
  onClick?: () => void;
  detailContent?: React.ReactNode;
}

export function InteractiveStatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient,
  onClick,
  detailContent 
}: StatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (detailContent) {
      setIsModalOpen(true);
    }
  };

  const isClickable = onClick || detailContent;

  return (
    <>
      <div
        className={`group ${gradient} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white transform hover:-translate-y-2 ${
          isClickable ? 'cursor-pointer' : ''
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/90 text-sm font-semibold uppercase tracking-wide">
            {title}
          </span>
          <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
            {icon}
          </span>
        </div>
        <div className="text-4xl font-bold mb-2">{value}</div>
        {subtitle && (
          <div className="text-white/90 text-sm font-medium flex items-center justify-between">
            <span>{subtitle}</span>
            {isClickable && (
              <span className="text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                Clicca per dettagli →
              </span>
            )}
          </div>
        )}
      </div>

      {detailContent && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={title}
          icon={icon}
        >
          {detailContent}
        </Modal>
      )}
    </>
  );
}

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    icon: string;
    color: string;
  };
  formatCurrency: (cents: number, currency?: string) => string;
  detailContent?: React.ReactNode;
}

export function InteractiveAccountCard({ account, formatCurrency, detailContent }: AccountCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-white dark:bg-gray-700 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-600 p-6 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
        style={{ borderLeftWidth: '6px', borderLeftColor: account.color }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
              {account.icon}
            </span>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                {account.name}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                {account.type}
              </span>
            </div>
          </div>
          <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className={`text-3xl font-bold ${
              account.balance >= 0 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(account.balance, account.currency)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clicca per dettagli
            </p>
          </div>
        </div>
      </div>

      {detailContent && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={account.name}
          icon={account.icon}
        >
          {detailContent}
        </Modal>
      )}
    </>
  );
}

interface SimpleChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
}

export function SimpleBarChart({ data, title }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {item.value >= 0 ? '+' : ''}{new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(item.value / 100)}
                </span>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                >
                  <span className="text-xs font-bold text-white">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SimplePieChart({ data, title }: SimpleChartProps) {
  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
  let currentAngle = 0;

  const slices = data.map(item => {
    const percentage = total > 0 ? (Math.abs(item.value) / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const slice = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        {title}
      </h3>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Simple pie visualization */}
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {slices.map((slice, index) => {
              const x1 = 50 + 40 * Math.cos((slice.startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((slice.startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((slice.endAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((slice.endAngle * Math.PI) / 180);
              const largeArc = slice.percentage > 50 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              );
            })}
            {/* Center white circle for donut effect */}
            <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">voci</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {slice.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {slice.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(Math.abs(slice.value) / 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
