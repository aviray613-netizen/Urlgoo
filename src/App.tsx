import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, Click, Stats } from './types';
import StatsOverview from './components/StatsOverview';
import AnalyticsChart from './components/AnalyticsChart';
import CreateLinkForm from './components/CreateLinkForm';
import LinksList from './components/LinksList';
import ClickLogs from './components/ClickLogs';
import ChannelBuilder from './components/ChannelBuilder';
import { MousePointerClick, RefreshCw, Zap, Clock, Info, ShieldCheck, Globe, HelpCircle } from 'lucide-react';

export default function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLinks: 0,
    totalClicks: 0,
    clicksOverTime: [],
    clicksByLink: [],
    clicksByChannel: [],
  });
  
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tiny domain config
  const [domainMode, setDomainMode] = useState<'short' | 'custom' | 'actual'>(() => {
    return (localStorage.getItem('domainMode') as any) || 'actual';
  });
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem('customDomain') || 't.co';
  });

  // UTC clock update for seconds precision
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [linksRes, clicksRes, statsRes] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/clicks'),
        fetch('/api/stats'),
      ]);

      if (linksRes.ok && clicksRes.ok && statsRes.ok) {
        const linksData = await linksRes.json();
        const clicksData = await clicksRes.json();
        const statsData = await statsRes.json();

        setLinks(linksData);
        setClicks(clicksData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading tracker data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh interval (5s)
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleLinkCreated = () => {
    // Refresh all data
    fetchData(true);
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracked link and its click history? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // If the deleted link was currently filtered, reset filter
        if (selectedLinkId === id) {
          setSelectedLinkId(null);
        }
        fetchData(true);
      } else {
        alert('Failed to delete the link.');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const formatClock = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  const formatDateLong = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEffectiveBaseUrl = () => {
    if (domainMode === 'actual') {
      return window.location.origin;
    }
    if (domainMode === 'custom') {
      let d = customDomain.trim() || 't.co';
      // Strip any leading http/https and trailing slash to construct standard clean look
      d = d.replace(/^(https?:\/\/)?(www\.)?/i, '').replace(/\/$/, '');
      return `https://${d}`;
    }
    return 'https://t.co';
  };

  const selectedLink = links.find((l) => l.id === selectedLinkId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-slate-950 shadow-md">
                <MousePointerClick className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-slate-100 bg-clip-text text-transparent">
                  Link Click Tracker
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Second-precision click analytics, redirects, and traffic trace dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Sync status & Exact Clock Widget */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Real-time Clock */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                  {formatClock(currentTime)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">
                  {formatDateLong(currentTime)}
                </span>
              </div>
            </div>

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <div className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </div>
              <button
                id="auto-refresh-toggle"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-[11px] font-medium text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Auto Sync:</span>
                <span className={`font-semibold uppercase ${autoRefresh ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {autoRefresh ? 'ON (5s)' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Manual Refresh */}
            <button
              id="header-refresh-btn"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md"
              title="Sync Tracker Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div id="loading-spinner-container" className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
              <Zap className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
            </div>
            <span className="text-sm font-medium animate-pulse">Initializing Tracing Engines...</span>
          </div>
        ) : (
          <motion.div
            id="dashboard-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stats Overview */}
            <StatsOverview links={links} clicks={clicks} />

            {/* Short Domain Settings Bar */}
            <div id="domain-settings-bar" className="p-4 bg-slate-900/60 backdrop-blur-sm border border-emerald-500/10 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-200 flex items-center gap-2 flex-wrap">
                    <span>Domain Display & Redirect Mode</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      {domainMode === 'actual' ? 'Live Trackable Active' : 'Visual Mockup'}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-xl">
                    Choose <strong>Actual Server URL</strong> to test real live click tracking and destination redirects. Choose <strong>Ultra-Short (t.co)</strong> or <strong>Custom</strong> to preview how they look with premium branded short domains.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setDomainMode('actual');
                      localStorage.setItem('domainMode', 'actual');
                    }}
                    className={`flex-1 lg:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      domainMode === 'actual'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Actual Server URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDomainMode('short');
                      localStorage.setItem('domainMode', 'short');
                    }}
                    className={`flex-1 lg:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      domainMode === 'short'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ultra-Short (t.co)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDomainMode('custom');
                      localStorage.setItem('domainMode', 'custom');
                    }}
                    className={`flex-1 lg:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      domainMode === 'custom'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Domain
                  </button>
                </div>

                {domainMode === 'custom' && (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 rounded-xl w-full lg:w-44">
                    <span className="text-[10px] text-slate-500 font-mono">https://</span>
                    <input
                      type="text"
                      placeholder="e.g., tiny.url, sh.rt"
                      value={customDomain}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/\s+/g, '');
                        setCustomDomain(val);
                        localStorage.setItem('customDomain', val);
                      }}
                      className="bg-transparent text-xs font-mono text-emerald-400 placeholder-slate-700 focus:outline-none w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Trends and Top list */}
            <AnalyticsChart clicksOverTime={stats.clicksOverTime} clicksByLink={stats.clicksByLink} />

            {/* Campaign Channel Builder (shown when a link is selected) */}
            {selectedLink && (
              <ChannelBuilder selectedLink={selectedLink} clicks={clicks} effectiveBaseUrl={getEffectiveBaseUrl()} domainMode={domainMode} />
            )}

            {/* Interactive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Creator Column (Create & Links List) */}
              <div className="lg:col-span-5 space-y-6">
                <CreateLinkForm onLinkCreated={handleLinkCreated} effectiveBaseUrl={getEffectiveBaseUrl()} domainMode={domainMode} />
                <LinksList
                  links={links}
                  onDeleteLink={handleDeleteLink}
                  selectedLinkId={selectedLinkId}
                  onSelectLink={setSelectedLinkId}
                  onRefresh={() => fetchData(true)}
                  effectiveBaseUrl={getEffectiveBaseUrl()}
                  domainMode={domainMode}
                />
              </div>

              {/* Traffic Logger Column */}
              <div className="lg:col-span-7">
                <ClickLogs
                  clicks={clicks}
                  links={links}
                  selectedLinkId={selectedLinkId}
                  onClearFilter={() => setSelectedLinkId(null)}
                />
              </div>

            </div>
          </motion.div>
        )}
      </main>

      {/* Workspace Status and Privacy Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 mt-12 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure redirection and analytics server is active</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono">Status: Connected</span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Click tracking is instant with millisecond precision</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
