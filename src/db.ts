import fs from 'fs';
import path from 'path';
import { Link, Click } from './types';

// Detect if we are on Vercel or in a read-only container environment
let DB_DIR = path.resolve(process.cwd(), 'data');
let LINKS_FILE = path.join(DB_DIR, 'links.json');
let CLICKS_FILE = path.join(DB_DIR, 'clicks.json');

// In-memory fallback for total safety in serverless environments
let inMemoryLinks: Link[] = [];
let inMemoryClicks: Click[] = [];
let useInMemoryFallback = false;

function initDb() {
  if (useInMemoryFallback) return;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(LINKS_FILE)) {
      fs.writeFileSync(LINKS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(CLICKS_FILE)) {
      fs.writeFileSync(CLICKS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error: any) {
    console.warn('Primary database initialization failed, trying /tmp/ fallback...', error.message);
    
    // Fallback to /tmp folder which is fully writable in Vercel Serverless Functions
    try {
      DB_DIR = path.join('/tmp', 'data');
      LINKS_FILE = path.join(DB_DIR, 'links.json');
      CLICKS_FILE = path.join(DB_DIR, 'clicks.json');
      
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (!fs.existsSync(LINKS_FILE)) {
        fs.writeFileSync(LINKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
      if (!fs.existsSync(CLICKS_FILE)) {
        fs.writeFileSync(CLICKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
      console.log('Successfully initialized database in writable /tmp directory.');
    } catch (tmpError: any) {
      console.error('Even /tmp database failed. Switching to robust in-memory storage fallback:', tmpError.message);
      useInMemoryFallback = true;
    }
  }
}

export function getLinks(): Link[] {
  initDb();
  if (useInMemoryFallback) {
    return inMemoryLinks;
  }
  try {
    const data = fs.readFileSync(LINKS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Link[];
    inMemoryLinks = parsed; // Sync memory representation
    return parsed;
  } catch (error) {
    console.error('Error reading links file, falling back to memory state:', error);
    return inMemoryLinks;
  }
}

export function saveLinks(links: Link[]) {
  inMemoryLinks = links; // Always update in-memory state
  initDb();
  if (useInMemoryFallback) return;

  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error writing links file:', error.message);
    // Switch to in-memory fallback to avoid crashes on future calls
    useInMemoryFallback = true;
  }
}

export function getClicks(): Click[] {
  initDb();
  if (useInMemoryFallback) {
    return inMemoryClicks;
  }
  try {
    const data = fs.readFileSync(CLICKS_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Click[];
    inMemoryClicks = parsed; // Sync memory representation
    return parsed;
  } catch (error) {
    console.error('Error reading clicks file, falling back to memory state:', error);
    return inMemoryClicks;
  }
}

export function saveClicks(clicks: Click[]) {
  inMemoryClicks = clicks; // Always update in-memory state
  initDb();
  if (useInMemoryFallback) return;

  try {
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(clicks, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error writing clicks file:', error.message);
    useInMemoryFallback = true;
  }
}

export function addLink(link: Link): Link {
  const links = getLinks();
  links.unshift(link); // New links first
  saveLinks(links);
  return link;
}

export function deleteLink(id: string): boolean {
  const links = getLinks();
  const updatedLinks = links.filter((l) => l.id !== id);
  if (links.length === updatedLinks.length) return false;

  saveLinks(updatedLinks);

  // Also clean up clicks for this link
  const clicks = getClicks();
  const updatedClicks = clicks.filter((c) => c.linkId !== id);
  saveClicks(updatedClicks);

  return true;
}

export function recordClick(linkId: string, click: Click): boolean {
  const links = getLinks();
  const linkIndex = links.findIndex((l) => l.id === linkId);
  if (linkIndex === -1) return false;

  // Increment clicks count
  links[linkIndex].clicksCount += 1;
  saveLinks(links);

  // Save click log
  const clicks = getClicks();
  clicks.unshift(click); // New clicks first
  saveClicks(clicks);

  return true;
}
