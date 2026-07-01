import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Click } from '../types';
import { Copy, Check, Radio, Share2, Facebook, Twitter, Mail, Linkedin, Youtube, Globe, Terminal, Info, BarChart3, ExternalLink, Settings, Link2 } from 'lucide-react';

interface ChannelBuilderProps {
  selectedLink: Link;
  clicks: Click[];
  effectiveBaseUrl: string;
  domainMode: 'short' | 'custom' | 'actual';
}

const CHANNELS_PRESETS = [
  { name: 'Facebook', icon: Facebook, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { name: 'Twitter', icon: Twitter, color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600 bg-blue-600/10 border-blue-600/20' },
  { name: 'Newsletter', icon: Mail, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { name: 'YouTube', icon: Youtube, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
];

export default function ChannelBuilder({ selectedLink, clicks, effectiveBaseUrl, domainMode }: ChannelBuilderProps) {
  const [selectedChannel, setSelectedChannel] = useState('Facebook');
  const [customChannel, setCustomChannel] = useState('');
  const [copied, setCopied] = useState(false);
  const [useCustomBase, setUseCustomBase] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  // Filter clicks for this specific link
  const linkClicks = clicks.filter((c) => c.linkId === selectedLink.id);

  const getActiveChannelName = () => {
    if (selectedChannel === 'Custom') {
      return customChannel.trim() || 'Custom';
    }
    return selectedChannel;
  };

  const getTrackingUrl = () => {
    const channelName = getActiveChannelName();
    const cleanChannel = encodeURIComponent(channelName.toLowerCase().replace(/\s+/g, '-'));
    
    let base = effectiveBaseUrl;
    if (useCustomBase && customBaseUrl.trim()) {
      let cleanBase = customBaseUrl.trim();
      if (!/^https?:\/\//i.test(cleanBase)) {
        cleanBase = `https://${cleanBase}`;
      }
      base = cleanBase;
    }
    
    const cleanBase = base.replace(/\/$/, '');
    if (domainMode === 'actual' || useCustomBase) {
      return `${cleanBase}/r/${selectedLink.id}?channel=${cleanChannel}`;
    }
    return `${cleanBase}/${selectedLink.id}?channel=${cleanChannel}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTrackingUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Calculate clicks by channel for this link
  const channelBreakdown: Record<string, number> = {};
  linkClicks.forEach((click) => {
    const ch = click.channel || 'Direct / Other';
    channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
  });

  const channelsData = Object.entries(channelBreakdown)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <motion.div
      id="channel-builder-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-5 bg-slate-900/60 backdrop-blur-sm border border-emerald-500/20 rounded-2xl shadow-xl mb-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-slate-200">Channel Campaign Link Builder</h3>
            <p className="text-[10px] text-slate-400">Generate and copy custom trackable links for each channel</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold font-mono uppercase">
          Link: {selectedLink.id}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Side: Builder Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              1. Choose a Marketing Channel / Source
            </label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedChannel === preset.name;
                return (
                  <button
                    key={preset.name}
                    id={`preset-ch-${preset.name.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(preset.name);
                      setCustomChannel('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{preset.name}</span>
                  </button>
                );
              })}

              <button
                id="preset-ch-custom"
                type="button"
                onClick={() => setSelectedChannel('Custom')}
                className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedChannel === 'Custom'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Custom Source...</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedChannel === 'Custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label htmlFor="custom-channel-input" className="text-[10px] text-slate-500 font-semibold uppercase">
                  Type Custom Channel Name
                </label>
                <input
                  id="custom-channel-input"
                  type="text"
                  placeholder="e.g., instagram, tiktok, flyer-qr, adwords-winter"
                  value={customChannel}
                  onChange={(e) => setCustomChannel(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-xs transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tracking Domain Selection */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Customize Tracking Domain / URL</span>
              </label>
              <button
                id="toggle-custom-base-btn"
                type="button"
                onClick={() => setUseCustomBase(!useCustomBase)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                  useCustomBase
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700'
                }`}
              >
                {useCustomBase ? 'Custom Domain Active' : 'Use Custom Domain'}
              </button>
            </div>

            {!useCustomBase ? (
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Tracking via App URL: <span className="text-slate-300 font-semibold">{window.location.origin}</span></span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  id="custom-base-url-input"
                  type="text"
                  placeholder="e.g., yourdomain.com or short.me"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="block w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-100 placeholder-slate-600 text-xs transition-all font-mono"
                />
                <p className="text-[9px] text-slate-500 leading-tight">
                  Enter the domain/base URL that visitors click. Clicks are logged to the tracker and redirected to the target.
                </p>
              </div>
            )}
          </div>

          {/* Generated Link Card */}
          <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                Trackable Link to Share on <span className="text-emerald-400 font-bold">{getActiveChannelName()}</span>
              </h4>
              <p className="text-emerald-400 font-mono text-xs mt-1.5 break-all select-all font-semibold bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                {getTrackingUrl()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                id="copy-channel-link-btn"
                onClick={handleCopy}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  copied
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Tracking Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link for {getActiveChannelName()}</span>
                  </>
                )}
              </button>

              <a
                href={getTrackingUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg flex items-center justify-center transition-all"
                title="Simulate / Test click"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Channel Analytics Preview */}
        <div className="border-l border-slate-800/60 pl-0 md:pl-5 flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Channel Performance for this Link</span>
            </h4>

            <div className="space-y-3">
              {channelsData.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-600 text-xs">
                  <Radio className="w-8 h-8 opacity-20 mb-1.5 animate-pulse" />
                  <span>No clicks traced for this link yet</span>
                  <span className="text-[10px] text-slate-500 text-center mt-1 max-w-[200px]">
                    Copy the link on the left and click it to test channel tracing!
                  </span>
                </div>
              ) : (
                channelsData.map((ch, idx) => {
                  const maxCount = Math.max(...channelsData.map((c) => c.count), 1);
                  const pct = (ch.count / maxCount) * 100;
                  return (
                    <div id={`ch-stat-${ch.name.toLowerCase()}`} key={ch.name} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-semibold text-slate-300">{ch.name}</span>
                        <span className="text-emerald-400 font-bold">{ch.count} Click(s)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive UTM Explanation Console */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mt-4">
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Automatic UTM Auto-Tracing Console</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When someone clicks this tracking link, our server automatically appends UTM parameters to the destination URL so systems like Google Analytics trace the channel perfectly:
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-emerald-400 mt-2 bg-slate-950 p-1.5 rounded border border-slate-900">
              <div className="flex flex-col">
                <span className="text-slate-500 font-semibold uppercase">Source</span>
                <span className="truncate">{getActiveChannelName().toLowerCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-semibold uppercase">Medium</span>
                <span>tracked_link</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-semibold uppercase">Campaign</span>
                <span className="truncate">tracker</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
