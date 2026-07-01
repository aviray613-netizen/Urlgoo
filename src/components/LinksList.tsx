import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from '../types';
import { Search, Link2, Copy, Check, Trash2, ExternalLink, Calendar, MousePointerClick, ChevronRight, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface LinksListProps {
  links: Link[];
  onDeleteLink: (id: string) => void;
  selectedLinkId: string | null;
  onSelectLink: (id: string | null) => void;
  onRefresh: () => void;
  effectiveBaseUrl: string;
  domainMode: 'short' | 'custom' | 'actual';
}

type SortOption = 'newest' | 'oldest' | 'most-clicks' | 'least-clicks' | 'title-az';

export default function LinksList({
  links,
  onDeleteLink,
  selectedLinkId,
  onSelectLink,
  onRefresh,
  effectiveBaseUrl,
  domainMode,
}: LinksListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getFullShortUrl = (code: string) => {
    if (domainMode === 'actual') {
      return `${effectiveBaseUrl}/r/${code}`;
    }
    const cleanBase = effectiveBaseUrl.replace(/\/$/, '');
    return `${cleanBase}/${code}`;
  };

  const handleCopy = async (id: string, code: string) => {
    try {
      const fullUrl = getFullShortUrl(code);
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ' at ' + d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Filter links
  const filteredLinks = links.filter((link) => {
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.originalUrl.toLowerCase().includes(query) ||
      link.id.toLowerCase().includes(query) ||
      (link.description && link.description.toLowerCase().includes(query))
    );
  });

  // Sort links
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'most-clicks':
        return b.clicksCount - a.clicksCount;
      case 'least-clicks':
        return a.clicksCount - b.clicksCount;
      case 'title-az':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return (
    <div id="links-list-card" className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-6 flex flex-col h-[520px]">
      {/* Header with Search and Sort */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200">Tracked Tiny Links</h3>
            <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
              {links.length}
            </span>
          </div>

          <button
            id="refresh-links-btn"
            onClick={onRefresh}
            className="self-end sm:self-auto p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Refresh Links"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="search-links-input"
              type="text"
              placeholder="Search by title, target URL, short code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-xs transition-all"
            />
          </div>

          {/* Sort selection */}
          <select
            id="sort-links-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="block px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-300 text-xs transition-all cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="most-clicks">Sort: Most Clicks</option>
            <option value="least-clicks">Sort: Least Clicks</option>
            <option value="title-az">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main List Area */}
      <div id="links-scroll-area" className="flex-1 overflow-y-auto p-4 space-y-3">
        {links.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-12">
            <Link2 className="w-12 h-12 opacity-15 mb-3 stroke-1" />
            <span className="font-medium text-slate-400">No tracked links found</span>
            <span className="text-xs text-slate-500 mt-1">Create your first tracking link above!</span>
          </div>
        ) : sortedLinks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-12">
            <AlertCircle className="w-10 h-10 opacity-30 mb-2 stroke-1 text-amber-500" />
            <span>No matching links for "{searchQuery}"</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sortedLinks.map((link) => {
              const isSelected = selectedLinkId === link.id;
              const fullShortUrl = getFullShortUrl(link.id);

              return (
                <motion.div
                  id={`link-item-${link.id}`}
                  key={link.id}
                  layoutId={`link-card-${link.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/80 border-emerald-500/40 shadow-emerald-500/5 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                  onClick={() => onSelectLink(isSelected ? null : link.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Title & Description */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-200 text-sm truncate" title={link.title}>
                          {link.title}
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                          {link.id}
                        </span>
                      </div>

                      {/* Premium Tiny URL visualization */}
                      <div className="text-xs font-mono text-emerald-400 font-semibold break-all">
                        {fullShortUrl}
                      </div>
                      
                      {link.description && (
                        <p className="text-xs text-slate-400 truncate max-w-md">
                          {link.description}
                        </p>
                      )}
 
                      {/* Original URL destination link */}
                      <a
                        href={link.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // don't trigger selection
                        className="text-[11px] text-slate-500 hover:text-blue-400 inline-flex items-center gap-1 truncate max-w-sm"
                      >
                        <span className="truncate">Destination: {link.originalUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    {/* Right side click stats badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1 justify-end">
                          <MousePointerClick className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-emerald-400 font-bold">{link.clicksCount}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Clicks</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : ''}`} />
                    </div>
                  </div>

                  {/* Actions & Details Overlay */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-800/40 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(link.createdAt)}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Copied URL */}
                        <button
                          id={`copy-list-btn-${link.id}`}
                          onClick={() => handleCopy(link.id, link.id)}
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                            copiedId === link.id
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                          }`}
                          title="Copy Short URL"
                        >
                          {copiedId === link.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        {/* Redirect Simulator / Preview */}
                        <a
                          id={`open-redirect-btn-${link.id}`}
                          href={`${window.location.origin}/r/${link.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1 transition-all"
                          title="Simulate Click Redirect"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Link</span>
                        </a>

                        {/* Delete */}
                        <button
                          id={`delete-list-btn-${link.id}`}
                          onClick={() => onDeleteLink(link.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-lg transition-all"
                          title="Delete Link permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div 
                        className="bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10 text-[11px] text-slate-400 leading-normal flex items-start gap-1.5" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Shortening with TinyURL / Bitly:</strong> You can copy our generated trackable URL and paste it into **TinyURL**, **Bitly**, or any other service. Since the tiny link redirects visitors back to us, **your clicks and traffic channels will still be fully tracked!**
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
        <span>Click a link to inspect its exact click details</span>
      </div>
    </div>
  );
}
