import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Click, Link } from '../types';
import { Activity, Chrome, Globe, Cpu, MapPin, Calendar, HelpCircle, Filter, X } from 'lucide-react';

interface ClickLogsProps {
  clicks: Click[];
  links: Link[];
  selectedLinkId: string | null;
  onClearFilter: () => void;
}

export default function ClickLogs({ clicks, links, selectedLinkId, onClearFilter }: ClickLogsProps) {
  const [showRawUserAgent, setShowRawUserAgent] = useState<string | null>(null);

  // Find the selected link's details
  const selectedLink = links.find((l) => l.id === selectedLinkId);

  // Filter clicks if a specific link is selected
  const filteredClicks = selectedLinkId
    ? clicks.filter((c) => c.linkId === selectedLinkId)
    : clicks;

  // Simple parser to make raw User Agent strings elegant
  const parseUserAgent = (ua: string) => {
    if (!ua || ua === 'Unknown Browser') return { browser: 'Unknown', os: 'Device' };

    let browser = 'Other Browser';
    let os = 'Unknown OS';

    // Parse Browser
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Parse OS
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('iPhone')) os = 'iOS (iPhone)';
    else if (ua.includes('iPad')) os = 'iOS (iPad)';
    else if (ua.includes('Android')) os = 'Android OS';
    else if (ua.includes('Linux')) os = 'Linux';

    return { browser, os };
  };

  const getRefererName = (referer: string) => {
    if (!referer || referer === 'Direct / Bookmark') return 'Direct / Bookmark';
    try {
      const url = new URL(referer);
      return url.hostname;
    } catch {
      return referer;
    }
  };

  const formatExactTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      
      // Hours, minutes, seconds formatting
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const secs = d.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

      const dateStr = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        time: `${formattedHours}:${mins}:${secs}`,
        ampm,
        date: dateStr,
      };
    } catch {
      return { time: '--:--:--', ampm: '', date: isoString };
    }
  };

  const getChannelBadge = (channel?: string) => {
    const ch = channel || 'Direct / Other';
    const name = ch.trim();
    
    if (/facebook/i.test(name)) {
      return { name, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
    if (/twitter|x\.com/i.test(name)) {
      return { name, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    }
    if (/linkedin/i.test(name)) {
      return { name, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
    if (/newsletter|email|mail/i.test(name)) {
      return { name, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
    if (/youtube/i.test(name)) {
      return { name, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
    if (name === 'Direct / Other') {
      return { name, bg: 'bg-slate-800/80 text-slate-400 border-slate-700/50' };
    }
    // Custom channel name
    return { name, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  };

  return (
    <div id="click-logs-card" className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Card Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="font-semibold text-slate-200">Click Traffic Logs</h3>
            <p className="text-[10px] text-slate-400">
              {selectedLinkId ? (
                <span className="text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Filter className="w-3 h-3" /> Filtering: "{selectedLink?.title || selectedLinkId}"
                </span>
              ) : (
                'Tracing clicks in real-time with second-level precision'
              )}
            </p>
          </div>
        </div>

        {selectedLinkId && (
          <button
            id="clear-filter-btn"
            onClick={onClearFilter}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Clear Filter</span>
          </button>
        )}
      </div>

      {/* Logs Table Area */}
      <div id="logs-scroll-area" className="flex-1 overflow-y-auto">
        {filteredClicks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-8 text-center">
            <Activity className="w-12 h-12 opacity-15 mb-3 stroke-1" />
            <span className="font-medium text-slate-400">No clicks recorded yet</span>
            <span className="text-xs text-slate-500 mt-1 max-w-xs">
              {selectedLinkId
                ? 'No one has clicked this specific link yet. Use the "Test Link" button to trigger a click redirect!'
                : 'Your links are waiting for clicks. Share the tracked links to see live visitor analytics.'}
            </span>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-800/60">
                <thead className="bg-slate-950/40 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold sticky top-0 bg-slate-900 z-10">
                  <tr>
                    <th scope="col" className="px-5 py-3">Exact Click Time</th>
                    <th scope="col" className="px-5 py-3">Link</th>
                    <th scope="col" className="px-5 py-3">Channel / Source</th>
                    <th scope="col" className="px-5 py-3">Visitor Details</th>
                    <th scope="col" className="px-5 py-3">Referrer</th>
                    <th scope="col" className="px-5 py-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  <AnimatePresence initial={false}>
                    {filteredClicks.map((click, index) => {
                      const { time, ampm, date } = formatExactTime(click.timestamp);
                      const { browser, os } = parseUserAgent(click.userAgent);
                      const referer = getRefererName(click.referer);
                      const chBadge = getChannelBadge(click.channel);
                      
                      // Find matching link info for title display
                      const linkInfo = links.find((l) => l.id === click.linkId);

                      return (
                        <motion.tr
                          id={`click-row-${click.id}`}
                          key={click.id}
                          initial={{ opacity: 0, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                          animate={{ opacity: 1, backgroundColor: 'transparent' }}
                          transition={{ duration: 0.5 }}
                          className="hover:bg-slate-800/20 transition-colors"
                        >
                          {/* Exact Time Column with Hour, Minute, Second */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                                <span>{time}</span>
                                <span className="text-[10px] text-emerald-500/80 uppercase">{ampm}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{date}</span>
                              </span>
                            </div>
                          </td>

                          {/* Link Column */}
                          <td className="px-5 py-3 max-w-[150px] truncate">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-slate-200 truncate" title={linkInfo?.title || 'Deleted Link'}>
                                {linkInfo?.title || <span className="text-rose-500 italic">Deleted Link</span>}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Code: {click.linkId}
                              </span>
                            </div>
                          </td>

                          {/* Channel Badge Column */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider ${chBadge.bg}`}>
                              {chBadge.name}
                            </span>
                          </td>

                          {/* Visitor Details (OS / Browser) */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-800/80 rounded-lg text-slate-400" title="User Agent Specs">
                                <Chrome className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-300">{browser}</span>
                                <span className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                  <Cpu className="w-2.5 h-2.5" /> {os}
                                </span>
                              </div>
                              {/* Trigger raw user agent tooltip */}
                              <button
                                id={`ua-info-btn-${click.id}`}
                                onMouseEnter={() => setShowRawUserAgent(click.id)}
                                onMouseLeave={() => setShowRawUserAgent(null)}
                                className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Raw User Agent Popup */}
                            {showRawUserAgent === click.id && (
                              <div className="absolute bg-slate-950 border border-slate-700 text-slate-300 text-[10px] p-2 rounded-lg shadow-2xl z-30 max-w-sm font-mono whitespace-normal">
                                {click.userAgent}
                              </div>
                            )}
                          </td>

                          {/* Referrer */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-blue-400/80 shrink-0" />
                              <span className="truncate max-w-[120px]" title={click.referer}>
                                {referer}
                              </span>
                            </span>
                          </td>

                          {/* IP Address */}
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80 inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500/80" />
                              <span>{click.ip}</span>
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer statistics */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center text-[11px] text-slate-500">
        <span>Click updates are real-time. Logs show precise click millisecond epochs.</span>
      </div>
    </div>
  );
}
