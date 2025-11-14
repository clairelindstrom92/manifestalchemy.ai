'use client';

import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Gold } from 'gleamy';
import { ArrowLeft, Calendar, Moon, Sun, Star } from 'lucide-react';

const zodiacNames = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const sunRanges = [
  { sign: 'Aries', start: '03-21', end: '04-19' },
  { sign: 'Taurus', start: '04-20', end: '05-20' },
  { sign: 'Gemini', start: '05-21', end: '06-20' },
  { sign: 'Cancer', start: '06-21', end: '07-22' },
  { sign: 'Leo', start: '07-23', end: '08-22' },
  { sign: 'Virgo', start: '08-23', end: '09-22' },
  { sign: 'Libra', start: '09-23', end: '10-22' },
  { sign: 'Scorpio', start: '10-23', end: '11-21' },
  { sign: 'Sagittarius', start: '11-22', end: '12-21' },
  { sign: 'Capricorn', start: '12-22', end: '01-19' },
  { sign: 'Aquarius', start: '01-20', end: '02-18' },
  { sign: 'Pisces', start: '02-19', end: '03-20' },
];

const signDescriptors: Record<string, string> = {
  Aries: 'Bold, pioneering, and motivated by fresh challenges.',
  Taurus: 'Grounded, sensual, and devoted to long-term comfort.',
  Gemini: 'Curious communicator thriving on versatility.',
  Cancer: 'Nurturing, intuitive, and guided by emotional tides.',
  Leo: 'Radiant, expressive, and eager to lead from the heart.',
  Virgo: 'Precise, mindful, and dedicated to crafting excellence.',
  Libra: 'Diplomatic, artful, and always seeking celestial harmony.',
  Scorpio: 'Transformational, magnetic, and unafraid of depth.',
  Sagittarius: 'Adventurous philosopher chasing horizon after horizon.',
  Capricorn: 'Strategic, resilient, and focused on legacy.',
  Aquarius: 'Visionary, collaborative, and future-forward.',
  Pisces: 'Mystical dreamer weaving compassion into everything.',
};

interface ChartPlacement {
  label: string;
  angle: number;
  color: string;
  description: string;
}

interface ChartResult {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  summary: string;
  placements: ChartPlacement[];
}

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const normalizeAngle = (angle: number) => {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const hashString = (value: string) =>
  value
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getSunSign = (date: Date): string => {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

  for (const range of sunRanges) {
    const { sign, start, end } = range;
    if (start < end) {
      if (monthDay >= start && monthDay <= end) return sign;
    } else {
      if (monthDay >= start || monthDay <= end) return sign;
    }
  }
  return 'Capricorn';
};

const signFromAngle = (angle: number) => {
  const index = Math.floor(normalizeAngle(angle) / 30) % 12;
  return zodiacNames[index];
};

const buildChart = (date: string, time: string, location: string): ChartResult => {
  const dateObj = new Date(`${date}T${time || '12:00'}`);
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error('Please enter a valid date and time.');
  }

  const dayOfYear = getDayOfYear(dateObj);
  const timeMinutes = dateObj.getUTCHours() * 60 + dateObj.getUTCMinutes();
  const locationSeed = hashString(location || 'earth') % 360;

  const sunAngle = normalizeAngle((dayOfYear / 365) * 360 + timeMinutes * 0.25);
  const moonAngle = normalizeAngle(sunAngle * 1.08 + locationSeed * 0.6);
  const risingAngle = normalizeAngle(timeMinutes * 0.5 + locationSeed * 1.2);

  const sunSign = getSunSign(dateObj);
  const moonSign = signFromAngle(moonAngle);
  const risingSign = signFromAngle(risingAngle);

  const placements: ChartPlacement[] = [
    {
      label: 'Sun',
      angle: sunAngle,
      color: '#E4B77D',
      description: signDescriptors[sunSign] || '',
    },
    {
      label: 'Moon',
      angle: moonAngle,
      color: '#F0C896',
      description: signDescriptors[moonSign] || '',
    },
    {
      label: 'Rising',
      angle: risingAngle,
      color: '#A6E3FF',
      description: signDescriptors[risingSign] || '',
    },
  ];

  const summary = `With a ${sunSign} sun, ${moonSign} moon, and ${risingSign} ascendant, your chart blends ${
    signDescriptors[sunSign]
  } The moon expresses your emotional landscape through ${signDescriptors[moonSign]?.toLowerCase()} while your rising sign introduces you as ${signDescriptors[
    risingSign
  ]?.toLowerCase()}.`;

  return { sunSign, moonSign, risingSign, summary, placements };
};

const ChartCanvas = ({ placements }: { placements: ChartPlacement[] }) => {
  const radius = 120;
  const center = 160;

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-sm mx-auto">
      <defs>
        <radialGradient id="chart-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E4B77D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E4B77D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius + 20}
        fill="url(#chart-glow)"
        opacity={0.6}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="#050505"
        stroke="#E4B77D40"
        strokeWidth={2}
      />
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = degToRad(index * 30 - 90);
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="#E4B77D20"
            strokeWidth={1}
          />
        );
      })}
      <circle
        cx={center}
        cy={center}
        r={4}
        fill="#E4B77D"
      />
      {placements.map((placement) => {
        const angleRad = degToRad(placement.angle - 90);
        const x = center + (radius - 12) * Math.cos(angleRad);
        const y = center + (radius - 12) * Math.sin(angleRad);
        const labelX = center + (radius - 40) * Math.cos(angleRad);
        const labelY = center + (radius - 40) * Math.sin(angleRad);
        return (
          <g key={placement.label}>
            <circle cx={x} cy={y} r={10} fill={placement.color} opacity={0.9} />
            <text
              x={labelX}
              y={labelY}
              fill="#fff"
              textAnchor="middle"
              fontSize="10"
            >
              {placement.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default function BirthChartPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    date: '',
    time: '',
    location: '',
  });
  const [chart, setChart] = useState<ChartResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateChart = () => {
    if (!form.date || !form.location) {
      setError('Please provide at least your birth date and birth location.');
      return;
    }
    try {
      const result = buildChart(form.date, form.time, form.location);
      setChart(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate chart right now.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-full border border-[#E4B77D] text-[#E4B77D] hover:bg-[#E4B77D]/10 transition-colors gold-shiny"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto pt-16 sm:pt-20 px-4 pb-10 space-y-6">
        <Gold acceleration={1} rendering edgeThickness={1} spread={0.5}>
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Calendar className="w-7 h-7 text-[#E4B77D] gold-shiny" />
            Interactive Birth Chart
          </h1>
        </Gold>

        <div className="border border-[#E4B77D]/30 rounded-2xl p-6 bg-black/60 backdrop-blur-sm">
          <p className="text-[#E4B77D]/70 text-center text-sm mb-4">
            Enter your birth details (city, country) — we’ll sketch a luminous natal chart instantly.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-wide text-[#a1a1aa] mb-1 block">
                Birth Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/50 border border-[#E4B77D]/40 rounded-lg text-white focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/20"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-wide text-[#a1a1aa] mb-1 block">
                Birth Time (optional)
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/50 border border-[#E4B77D]/40 rounded-lg text-white focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/20"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-wide text-[#a1a1aa] mb-1 block">
                Birth Location
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                placeholder="e.g. Paris, France"
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/50 border border-[#E4B77D]/40 rounded-lg text-white placeholder-[#E4B77D]/40 focus:outline-none focus:border-[#E4B77D] focus:ring-2 focus:ring-[#E4B77D]/20"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-400 mt-3 text-center">{error}</p>
          )}
          <button
            onClick={handleGenerateChart}
            className="mt-4 w-full px-4 py-2 border border-[#E4B77D] text-[#E4B77D] rounded-lg hover:bg-[#E4B77D]/10 transition-colors gold-shiny"
          >
            Generate Chart
          </button>
        </div>

        {chart && (
          <>
            <div className="bg-black/60 border border-[#E4B77D]/30 rounded-2xl p-6">
              <ChartCanvas placements={chart.placements} />
              <p className="mt-4 text-sm text-[#f5f5f7]/80 text-center leading-relaxed">
                {chart.summary}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Sun, label: 'Sun Sign', value: chart.sunSign },
                { icon: Moon, label: 'Moon Sign', value: chart.moonSign },
                { icon: Star, label: 'Rising Sign', value: chart.risingSign },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="border border-[#E4B77D]/30 rounded-xl p-4 bg-black/50 backdrop-blur text-center"
                >
                  <Icon className="w-8 h-8 text-[#E4B77D] mx-auto mb-2 gold-shiny" />
                  <Gold acceleration={1} rendering edgeThickness={1} spread={0.5}>
                    <p className="font-semibold text-white">{label}</p>
                  </Gold>
                  <p className="text-[#F0C896] text-lg font-semibold">{value}</p>
                  <p className="text-xs text-[#a1a1aa] mt-2">
                    {signDescriptors[value] || ''}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

