import { Link, Click } from '../types';
import { Link2, MousePointerClick, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsOverviewProps {
  links: Link[];
  clicks: Click[];
}

export default function StatsOverview({ links, clicks }: StatsOverviewProps) {
  const totalLinks = links.length;
  const totalClicks = clicks.length;
  const activeLinks = links.filter((l) => l.clicksCount > 0).length;
  const avgClicks = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : '0.0';

  // Find the peak click hour
  const hours = clicks.map((c) => new Date(c.timestamp).getHours());
  const hourCounts: Record<number, number> = {};
  hours.forEach((h) => {
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  let peakHourStr = 'N/A';
  let maxHourCount = 0;
  Object.entries(hourCounts).forEach(([h, count]) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const formattedHr = hr % 12 || 12;
      peakHourStr = `${formattedHr}:00 ${ampm}`;
    }
  });

  const cards = [
    {
      id: 'total-links',
      title: 'Total Links',
      value: totalLinks,
      subtitle: `${activeLinks} active links`,
      icon: Link2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'total-clicks',
      title: 'Total Clicks',
      value: totalClicks,
      subtitle: 'Recorded in seconds',
      icon: MousePointerClick,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'avg-clicks',
      title: 'Average CTR',
      value: avgClicks,
      subtitle: 'Clicks per link',
      icon: BarChart3,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      id: 'peak-time',
      title: 'Peak Click Time',
      value: peakHourStr,
      subtitle: maxHourCount > 0 ? `${maxHourCount} click(s) logged` : 'No clicks logged yet',
      icon: Calendar,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div id="stats-overview-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            id={card.id}
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`p-5 rounded-xl border bg-slate-900/60 backdrop-blur-sm shadow-lg flex items-center justify-between hover:scale-[1.02] transition-all duration-200 ${card.color.split(' ').slice(2).join(' ')}`}
          >
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-slate-100">{card.value}</h3>
              <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
            </div>
            <div className={`p-3 rounded-lg border ${card.color.split(' ').slice(0, 2).join(' ')}`}>
              <Icon className="w-6 h-6" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
