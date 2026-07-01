import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Link2, Copy, Check, Info, Loader2, HelpCircle } from 'lucide-react';
import { Link } from '../types';

interface CreateLinkFormProps {
  onLinkCreated: (newLink: Link) => void;
  effectiveBaseUrl: string;
  domainMode: 'short' | 'custom' | 'actual';
}

export default function CreateLinkForm({ onLinkCreated, effectiveBaseUrl, domainMode }: CreateLinkFormProps) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customCode, setCustomCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<Link | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedLink(null);

    if (!originalUrl.trim()) {
      setError('Please provide a destination URL to track.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          title: title || undefined,
          description: description || undefined,
          customCode: customCode || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Something went wrong while creating the link.');
      }

      const data: Link = await response.json();
      onLinkCreated(data);
      setCreatedLink(data);
      
      // Clear form inputs
      setOriginalUrl('');
      setTitle('');
      setDescription('');
      setCustomCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with server.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFullShortUrl = (code: string) => {
    if (domainMode === 'actual') {
      return `${effectiveBaseUrl}/r/${code}`;
    }
    const cleanBase = effectiveBaseUrl.replace(/\/$/, '');
    return `${cleanBase}/${code}`;
  };

  const handleCopy = async (code: string) => {
    try {
      const fullUrl = getFullShortUrl(code);
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <motion.div
      id="create-link-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl mb-6 relative overflow-hidden"
    >
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-emerald-400" />
        <span>Create Tracked Link</span>
      </h3>

      <form id="create-link-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Destination URL Input */}
        <div className="space-y-1">
          <label htmlFor="originalUrl" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Destination URL *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-slate-500" />
            </div>
            <input
              id="originalUrl"
              type="text"
              required
              placeholder="e.g., google.com or https://yourdomain.com/blog/article-1"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Custom Short Code (Alias) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="customCode" className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Custom Short Code</span>
              <span className="text-[10px] text-slate-500 lowercase normal-case">(optional)</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Type any length or text! (e.g., <span className="text-emerald-400 font-bold">sale</span> or <span className="text-emerald-400 font-bold">social/fb</span>)
            </span>
          </div>

          <div className="flex rounded-xl bg-slate-950/80 border border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden">
            <span className="inline-flex items-center px-3 text-slate-500 text-xs border-r border-slate-900 bg-slate-900/40 select-none font-mono">
              /r/
            </span>
            <input
              id="customCode"
              type="text"
              placeholder="e.g., campaign/fb, bio, custom.slug, or leave blank"
              value={customCode}
              onChange={(e) => {
                // Allow alphanumeric, dashes, underscores, slashes, dots, and spaces
                const clean = e.target.value.replace(/[^a-zA-Z0-9-_\/. ]/g, '').toLowerCase();
                setCustomCode(clean);
              }}
              className="block w-full px-3 py-2.5 bg-transparent border-0 text-slate-100 placeholder-slate-600 text-sm focus:ring-0 focus:outline-none font-mono"
            />
            {customCode && (
              <button
                id="clear-custom-code-btn"
                type="button"
                onClick={() => setCustomCode('')}
                className="px-3 text-xs text-slate-500 hover:text-slate-300 border-l border-slate-900 transition-all"
                title="Use random short code"
              >
                Clear
              </button>
            )}
          </div>

          {/* Real-time Link Preview or Helper Messages */}
          <div className="text-[11px] px-1">
            {customCode ? (
              <div className="space-y-1.5">
                <div className="text-slate-400 font-mono flex flex-wrap items-center gap-1.5 leading-relaxed">
                  <span>Your active redirect URL:</span>
                  <span className="text-emerald-400 font-bold break-all bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {getFullShortUrl(customCode)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Spaces are automatically converted to hyphens (<span className="text-emerald-400">-</span>). You can enter as many subfolders or characters as you wish!
                </p>
              </div>
            ) : (
              <div className="text-slate-500 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Default: random ultra-short 4-character link (e.g., {getFullShortUrl('aB8k')})</span>
              </div>
            )}
          </div>
        </div>

        {/* Title and Description in Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Link Title <span className="text-[10px] text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., My Portfolio, Summer Newsletter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-sm transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Description <span className="text-[10px] text-slate-500 lowercase">(optional)</span>
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g., Short description for social sharing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-sm transition-all"
            />
          </div>
        </div>

        {error && (
          <motion.p
            id="create-link-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}

        <div className="pt-2 flex justify-end">
          <button
            id="submit-link-btn"
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Trackable Link...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Create Tracking Link</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Animation Overlay for Created Link */}
      <AnimatePresence>
        {createdLink && (
          <motion.div
            id="success-overlay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-0 bg-slate-950 p-6 flex flex-col justify-between border border-emerald-500/30 rounded-2xl z-25"
          >
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
                <Check className="w-5 h-5 bg-emerald-500/20 rounded-full p-0.5 stroke-[3px]" />
                <span>Tracking Link Successfully Generated!</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Destination URL</h4>
                  <p className="text-sm font-medium text-slate-300 truncate mt-0.5">{createdLink.originalUrl}</p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Your Tracked Tiny Link</h5>
                    <p className="text-emerald-400 font-mono text-sm mt-0.5 truncate select-all">
                      {getFullShortUrl(createdLink.id)}
                    </p>
                  </div>
                  <button
                    id="copy-overlay-btn"
                    onClick={() => handleCopy(createdLink.id)}
                    className={`p-2.5 rounded-lg border transition-all ${
                      copied
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                    title="Copy Tracked Link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-xs text-slate-300 leading-relaxed space-y-1.5">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Want an even shorter link? (TinyURL / Bitly)</span>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Yes! You can copy our generated trackable URL above and paste it into **TinyURL**, **Bitly**, or any other shortener. 
                  </p>
                  <p className="text-[10px] text-slate-400">
                    When someone clicks your custom TinyURL, it redirects them instantly through our tracking server first, meaning **your click tracker will still log and track every single visit flawlessly!**
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-900 pt-3 mt-4">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Clicks are registered instantly down to the second.</span>
              </p>
              <button
                id="close-success-btn"
                onClick={() => setCreatedLink(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Create Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
