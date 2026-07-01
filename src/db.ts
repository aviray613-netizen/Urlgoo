import fs from 'fs';
import path from 'path';
import { Link, Click } from './types';

const DB_DIR = path.resolve(process.cwd(), 'data');
const LINKS_FILE = path.join(DB_DIR, 'links.json');
const CLICKS_FILE = path.join(DB_DIR, 'clicks.json');

function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(LINKS_FILE)) {
    fs.writeFileSync(LINKS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(CLICKS_FILE)) {
    fs.writeFileSync(CLICKS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getLinks(): Link[] {
  initDb();
  try {
    const data = fs.readFileSync(LINKS_FILE, 'utf-8');
    return JSON.parse(data) as Link[];
  } catch (error) {
    console.error('Error reading links file:', error);
    return [];
  }
}

export function saveLinks(links: Link[]) {
  initDb();
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing links file:', error);
  }
}

export function getClicks(): Click[] {
  initDb();
  try {
    const data = fs.readFileSync(CLICKS_FILE, 'utf-8');
    return JSON.parse(data) as Click[];
  } catch (error) {
    console.error('Error reading clicks file:', error);
    return [];
  }
}

export function saveClicks(clicks: Click[]) {
  initDb();
  try {
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(clicks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing clicks file:', error);
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
