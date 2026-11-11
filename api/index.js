const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const multer = require('multer');
const matter = require('gray-matter');
const cookieParser = require('cookie-parser');
const supabase = require('./supabase');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3001;
let isRebuilding = false;

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Paths
const PORTFOLIO_ROOT = path.resolve(__dirname, '..');
const FEATURED_DIR = path.join(PORTFOLIO_ROOT, 'content', 'featured');
const AI_PROJECTS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'ai-projects');
const PROJECTS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'projects');
const SETTINGS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'settings');
const CASE_STUDIES_DIR = path.join(PORTFOLIO_ROOT, 'content', 'case-studies');
const JOBS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'jobs');
const RESUME_DIR = path.join(PORTFOLIO_ROOT, 'content', 'resume');
const HERO_DIR = path.join(PORTFOLIO_ROOT, 'content', 'hero');
const ABOUT_DIR = path.join(PORTFOLIO_ROOT, 'content', 'about');
const STATIC_DIR = path.join(PORTFOLIO_ROOT, 'static');
const UPLOADS_DIR = path.join(STATIC_DIR, 'uploads', 'case-studies');

const triggerLocalGatsbyRefresh = async () => {
  const ports = [process.env.GATSBY_PORT, 3002, 3000, 8000, 8001].filter(Boolean);
  const uniquePorts = [...new Set(ports)];
  for (const port of uniquePorts) {
    try {
      const res = await fetch(`http://localhost:${port}/__refresh`, { method: 'POST' });
      if (res.ok) {
        console.log(`[Refresh] Local Gatsby refresh sent to port ${port}. Status: ${res.status}`);
      }
    } catch (err) {
      // ignore unreachable ports
    }
  }
};

// Middleware
app.use((req, res, next) => {
  console.log('[API Server] Received request:', req.method, req.url);
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());

// Serve Admin & Uploaded static files directly (index.html contains embedded login overlay)
app.use('/admin', express.static(path.join(STATIC_DIR, 'admin')));
app.use('/uploads', express.static(path.join(STATIC_DIR, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    rebuilding: isRebuilding,
    mode: process.env.LOCAL_REBUILD === 'true' ? 'local-rebuild' : 'git-webhook',
  });
});

app.get('/login', (req, res) => {
  // If they are already logged in, redirect them to admin
  if (req.cookies && req.cookies.admin_auth === 'valid') {
    return res.redirect('/admin');
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(fs.readFileSync(path.join(STATIC_DIR, 'login.html'), 'utf8'));
});

// Login endpoint sets cookie (Encrypted password validation)
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  try {
    const validHashes = [
      process.env.ADMIN_HASH_1 || '$2b$10$b7IVQjErORuBOzap398OD.9focQtqaaBSh.mC8QpCGpIjh0eczKRG',
      process.env.ADMIN_HASH_2 || '$2b$10$7d2A9Re2bmE28ITehetB6em2eZ/CKwHKA1iN3Q1SwzR0ijrgpT/O6'
    ];
    let isValid = false;
    if (password) {
      for (const hash of validHashes) {
        if (bcrypt.compareSync(password, hash)) {
          isValid = true;
          break;
        }
      }
    }
    if (isValid) {
      res.cookie('admin_auth', 'valid', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax', path: '/' });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Status Check Endpoint
app.get('/api/auth/check', (req, res) => {
  if (req.cookies && req.cookies.admin_auth === 'valid') {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false, error: 'Unauthorized' });
});

// Settings API (Public & Admin)
app.get('/api/settings/ai-play', (req, res) => {
  try {
    const filePath = path.join(SETTINGS_DIR, 'aiPlay.json');
    if (!fs.existsSync(filePath)) {
      return res.json({ showTab: true });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/ai-play', async (req, res) => {
  try {
    if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    const { showTab } = req.body;
    const filePath = path.join(SETTINGS_DIR, 'aiPlay.json');
    fs.writeFileSync(filePath, JSON.stringify({ showTab: !!showTab }, null, 2));
    await triggerLocalGatsbyRefresh();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Site Pet Settings (Public & Admin)
app.get('/api/settings/site-pet', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const filePath = path.join(SETTINGS_DIR, 'sitePet.json');
    if (!fs.existsSync(filePath)) {
      return res.json({ enabled: true });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ enabled: data.enabled !== false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/site-pet', async (req, res) => {
  try {
    if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    const { enabled } = req.body;
    const isEnabled = enabled !== false;
    const filePath = path.join(SETTINGS_DIR, 'sitePet.json');
    fs.writeFileSync(filePath, JSON.stringify({ enabled: isEnabled }, null, 2));

    try {
      const staticSettingsPath = path.join(STATIC_DIR, 'site-pet-settings.json');
      fs.writeFileSync(staticSettingsPath, JSON.stringify({ enabled: isEnabled }, null, 2));
    } catch (e) {}

    await triggerLocalGatsbyRefresh();
    res.json({ success: true, enabled: isEnabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resume Endpoints
app.get('/api/resume', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const filePath = path.join(RESUME_DIR, 'resume.json');
    if (!fs.existsSync(filePath)) {
      return res.json({ type: 'url', value: '' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume', async (req, res) => {
  try {
    let { type, value } = req.body;
    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Value is required' });
    }
    value = value.trim();
    if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('/') && !value.startsWith('#')) {
      value = `https://${value}`;
    }
    const filePath = path.join(RESUME_DIR, 'resume.json');
    if (!fs.existsSync(RESUME_DIR)) fs.mkdirSync(RESUME_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ type: type || 'url', value }, null, 2));
    await triggerLocalGatsbyRefresh();
    res.json({ success: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware for everything else
app.use((req, res, next) => {
  if (req.cookies && req.cookies.admin_auth === 'valid') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
});

// Multer config for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/featured',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg', 'gif', 'svg'],
  },
});
const upload = multer({ storage });

const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio/resumes',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});
const uploadResume = multer({ storage: resumeStorage });

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function findMarkdownFile(dir) {
  const files = fs.readdirSync(dir);
  const md = files.find(f => f === 'index.md');
  const xxmd = files.find(f => f === 'index.xxmd');
  if (md) return { path: path.join(dir, md), published: true };
  if (xxmd) return { path: path.join(dir, xxmd), published: false };
  return null;
}

function findCoverImage(dir) {
  const files = fs.readdirSync(dir);
  const imageExts = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
  const cover = files.find(f => {
    const ext = path.extname(f).toLowerCase();
    const name = path.basename(f, ext).toLowerCase();
    return imageExts.includes(ext) && (name === 'cover' || name.includes('cover') || name.includes('front'));
  });
  // If no cover-named file, find the first image that's referenced in frontmatter
  return cover || files.find(f => imageExts.includes(path.extname(f).toLowerCase()));
}

function parseFeaturedProject(slug) {
  const dir = path.join(FEATURED_DIR, slug);
  if (!fs.statSync(dir).isDirectory()) return null;

  const mdFile = findMarkdownFile(dir);
  if (!mdFile) return null;

  const raw = fs.readFileSync(mdFile.path, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const coverImage = findCoverImage(dir);

  return {
    slug,
    title: frontmatter.title || slug,
    date: frontmatter.date || '0',
    cover: frontmatter.cover || '',
    coverImage: coverImage || null,
    cta: frontmatter.cta || '',
    external: frontmatter.external || '',
    button: frontmatter.button || 'Read More',
    role: frontmatter.role || '',
    tech: frontmatter.tech || [],
    description: content.trim(),
    published: mdFile.published,
  };
}

function parseJob(slug) {
  const dir = path.join(JOBS_DIR, slug);
  if (!fs.statSync(dir).isDirectory()) return null;

  const mdFile = findMarkdownFile(dir);
  if (!mdFile) return null;

  const raw = fs.readFileSync(mdFile.path, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  return {
    slug,
    title: frontmatter.title || '',
    company: frontmatter.company || slug,
    location: frontmatter.location || '',
    range: frontmatter.range || '',
    date: frontmatter.date || '',
    url: frontmatter.url || '',
    description: content.trim(),
    published: mdFile.published,
  };
}

function parsePlayProject(slug, type) {
  const baseDir = type === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
  const dir = path.join(baseDir, slug);
  if (!fs.statSync(dir).isDirectory()) return null;

  const mdFile = findMarkdownFile(dir);
  if (!mdFile) return null;

  const raw = fs.readFileSync(mdFile.path, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const coverImage = findCoverImage(dir);

  return {
    slug,
    type,
    title: frontmatter.title || slug,
    date: frontmatter.date || '0',
    cover: frontmatter.coverUrl || '',
    coverImage: coverImage || null,
    external: frontmatter.external || '',
    tech: frontmatter.tech || [],
    description: content.trim(),
    published: mdFile.published !== false,
  };
}

// Helper: escape a value for YAML single-quoting
function yq(val) {
  if (val === undefined || val === null) return "''";
  const s = String(val);
  // Single-quote and escape internal single quotes by doubling them
  return "'" + s.replace(/'/g, "''") + "'";
}

// Helper: build YAML tech list
function yamlTechList(tech) {
  if (!tech || !tech.length) return 'tech:\n  - User Experience';
  return 'tech:\n' + tech.map(t => `  - ${t}`).join('\n');
}

function writeFeaturedMarkdown(dir, data) {
  const ext = data.published !== false ? '.md' : '.xxmd';
  const filePath = path.join(dir, `index${ext}`);

  // Remove old index files
  ['index.md', 'index.xxmd'].forEach(f => {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Build frontmatter manually to preserve URL quoting
  const lines = [
    '---',
    `date: ${yq(data.date || '1')}`,
    `title: ${yq(data.title)}`,
    `cover: ${yq(data.cover || './cover.webp')}`,
    `cta: ${yq(data.cta || '')}`,
    `external: ${yq(data.external || '')}`,
    `button: ${yq(data.button || 'Read More')}`,
    `role: ${yq(data.role || '')}`,
    yamlTechList(data.tech),
    '---',
    '',
    (data.description || '').trim(),
    '',
  ];

  fs.writeFileSync(filePath, lines.join('\n'));
  triggerLocalGatsbyRefresh();
}

function writePlayMarkdown(dir, data) {
  const ext = data.published !== false ? '.md' : '.xxmd';
  const filePath = path.join(dir, `index${ext}`);

  // Remove old index files
  ['index.md', 'index.xxmd'].forEach(f => {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Build frontmatter manually to preserve URL quoting
  const lines = [
    '---',
    `date: ${yq(data.date || '1')}`,
    `title: ${yq(data.title)}`,
    `coverUrl: ${yq(data.cover || '')}`,
    `external: ${yq(data.external || '')}`,
    `showInProjects: true`,
    yamlTechList(data.tech),
    '---',
    '',
    (data.description || '').trim(),
    '',
  ];

  fs.writeFileSync(filePath, lines.join('\n'));
  triggerLocalGatsbyRefresh();
}

function writeJobMarkdown(dir, data) {
  const ext = data.published !== false ? '.md' : '.xxmd';
  const filePath = path.join(dir, `index${ext}`);

  // Remove old index files
  ['index.md', 'index.xxmd'].forEach(f => {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // Build frontmatter manually to preserve quoting
  const lines = [
    '---',
    `date: ${yq(data.date || new Date().toISOString().split('T')[0])}`,
    `title: ${yq(data.title)}`,
    `company: ${yq(data.company)}`,
    `location: ${yq(data.location || '')}`,
    `range: ${yq(data.range || '')}`,
    `url: ${yq(data.url || '#')}`,
    '---',
    '',
    (data.description || '').trim(),
    '',
  ];

  fs.writeFileSync(filePath, lines.join('\n'));
  triggerLocalGatsbyRefresh();
}
function parseCaseStudy(slug) {
  const dir = path.join(CASE_STUDIES_DIR, slug);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;

  const mdFile = findMarkdownFile(dir);
  if (!mdFile) return null;

  const raw = fs.readFileSync(mdFile.path, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  let details = frontmatter.details;
  if (!details) {
    details = [];
    if (frontmatter.role) details.push({ label: 'My Role', value: frontmatter.role });
    if (frontmatter.results) details.push({ label: 'Project Type', value: frontmatter.results });
    if (frontmatter.methods) details.push({ label: 'Timeline', value: frontmatter.methods });
  }

  return {
    slug,
    title: frontmatter.title || slug,
    date: frontmatter.date || '0',
    summary: frontmatter.summary || '',
    details: details,
    role: frontmatter.role || '',
    results: frontmatter.results || '',
    methods: frontmatter.methods || '',
    banner: frontmatter.banner || '',
    toc_enabled: !!frontmatter.tocEnabled,
    toc_items: frontmatter.tocItems || [],
    markdown: content.trim(),
    published: mdFile.published,
    project_type: frontmatter.project_type || 'case-study',
    ai_label: frontmatter.ai_label || (frontmatter.project_type === 'ai-lab' ? 'AI LAB' : ''),
    labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : [],
    cta_button: frontmatter.cta_button || null,
  };
}

function writeCaseStudyMarkdown(dir, data) {
  const ext = data.published !== false ? '.md' : '.xxmd';
  const filePath = path.join(dir, `index${ext}`);

  ['index.md', 'index.xxmd'].forEach(f => {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  let tocItemsStr = 'tocItems: []';
  if (data.toc_items && data.toc_items.length) {
    tocItemsStr = 'tocItems:\n' + data.toc_items.map(item => `  - text: ${yq(item.text)}\n    anchor: ${yq(item.anchor)}`).join('\n');
  }

  let detailsStr = '';
  if (data.details && data.details.length > 0) {
    detailsStr = 'details:\n' + data.details.map(item => `  - label: ${yq(item.label)}\n    value: ${yq(item.value)}`).join('\n');
  }

  let labelsStr = '';
  if (data.labels && Array.isArray(data.labels) && data.labels.length > 0) {
    labelsStr = 'labels:\n' + data.labels.map(l => `  - ${yq(l)}`).join('\n');
  }

  let ctaButtonStr = '';
  if (data.cta_button && data.cta_button.enabled) {
    ctaButtonStr = `cta_button:\n  enabled: true\n  text: ${yq(data.cta_button.text || '')}\n  url: ${yq(data.cta_button.url || '')}\n  styleVariant: ${yq(data.cta_button.styleVariant || 'outline')}\n  color: ${yq(data.cta_button.color || '#64ffda')}`;
  }

  const lines = [
    '---',
    `title: ${yq(data.title)}`,
    `slug: ${yq(data.slug)}`,
    `date: ${yq(data.date || new Date().toISOString().split('T')[0])}`,
    `published: ${data.published !== false}`,
    `project_type: ${yq(data.project_type || 'case-study')}`,
    data.project_type === 'ai-lab' ? `ai_label: ${yq(data.ai_label || 'AI LAB')}` : '',
    `summary: ${yq(data.summary || '')}`,
    data.project_type === 'case-study' ? detailsStr : '',
    labelsStr,
    ctaButtonStr,
    `banner: ${yq(data.banner || '')}`,
    `tocEnabled: ${!!data.toc_enabled}`,
    tocItemsStr,
    '---',
    '',
    (data.markdown || '').trim(),
    '',
  ].filter(l => l !== undefined && l !== null && l !== '');

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, lines.join('\n'));
  triggerLocalGatsbyRefresh();
}

// ─────────────────────────────────────────────
// PLAY PROJECTS (AI & OTHER)
// ─────────────────────────────────────────────

app.get('/api/play-projects', async (req, res) => {
  try {
    if (!fs.existsSync(AI_PROJECTS_DIR)) fs.mkdirSync(AI_PROJECTS_DIR, { recursive: true });
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    
    const aiSlugs = fs.readdirSync(AI_PROJECTS_DIR).filter(f => fs.statSync(path.join(AI_PROJECTS_DIR, f)).isDirectory());
    const otherSlugs = fs.readdirSync(PROJECTS_DIR).filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory());
    
    const aiProjects = aiSlugs.map(slug => parsePlayProject(slug, 'ai')).filter(Boolean);
    const otherProjects = otherSlugs.map(slug => parsePlayProject(slug, 'other')).filter(Boolean);
    
    const projects = [...aiProjects, ...otherProjects];
    // Sort by date desc
    projects.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/play-projects/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order array required' });

    const baseDate = new Date('2030-01-01');
    for (let i = 0; i < order.length; i++) {
      const { slug, type } = order[i];
      const baseDir = type === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
      const dir = path.join(baseDir, slug);
      if (!fs.existsSync(dir)) continue;

      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const newDate = d.toISOString().split('T')[0];

      const existing = parsePlayProject(slug, type);
      if (existing) {
        existing.date = newDate;
        writePlayMarkdown(dir, existing);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/play-projects', upload.single('cover'), async (req, res) => {
  try {
    const { title, description, external, tech, date, type } = req.body;
    const pType = type === 'other' ? 'other' : 'ai';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const baseDir = pType === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    
    const dir = path.join(baseDir, slug);
    if (fs.existsSync(dir)) return res.status(400).json({ error: 'Project already exists' });
    fs.mkdirSync(dir);

    const coverUrl = req.file ? req.file.path : '';
    const techArray = tech ? tech.split(',').map(t => t.trim()) : [];

    const data = {
      title,
      description,
      external,
      tech: techArray,
      date: date || new Date().toISOString().split('T')[0],
      cover: coverUrl,
      published: true
    };

    writePlayMarkdown(dir, data);
    res.json({ success: true, slug, type: pType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/play-projects/:type/:slug', upload.single('cover'), async (req, res) => {
  try {
    const { slug, type } = req.params;
    const baseDir = type === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
    const dir = path.join(baseDir, slug);
    if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Not found' });

    const existing = parsePlayProject(slug, type);
    const { title, description, external, tech, date, type: newType, deleteCover } = req.body;
    
    let coverUrl = req.file ? req.file.path : existing.cover;
    if (deleteCover === 'true') {
      coverUrl = '';
    }
    const techArray = tech ? tech.split(',').map(t => t.trim()) : existing.tech;

    const data = {
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      external: external !== undefined ? external : existing.external,
      tech: techArray,
      date: date || existing.date,
      cover: coverUrl,
      published: existing.published
    };
    
    const pNewType = newType === 'other' ? 'other' : 'ai';

    if (pNewType !== type) {
      // Type changed, move directory
      const newBaseDir = pNewType === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
      if (!fs.existsSync(newBaseDir)) fs.mkdirSync(newBaseDir, { recursive: true });
      const newDir = path.join(newBaseDir, slug);
      if (fs.existsSync(newDir)) return res.status(400).json({ error: 'Project already exists in new type' });
      
      writePlayMarkdown(dir, data); // update in old location first
      fs.renameSync(dir, newDir); // then move
    } else {
      writePlayMarkdown(dir, data);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/play-projects/:type/:slug', async (req, res) => {
  try {
    const { slug, type } = req.params;
    const baseDir = type === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
    const dir = path.join(baseDir, slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      await triggerLocalGatsbyRefresh();
      res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/play-projects/:type/:slug/toggle-publish', async (req, res) => {
  try {
    const { slug, type } = req.params;
    const baseDir = type === 'other' ? PROJECTS_DIR : AI_PROJECTS_DIR;
    const dir = path.join(baseDir, slug);
    if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Not found' });

    const data = parsePlayProject(slug, type);
    data.published = !data.published;
    writePlayMarkdown(dir, data);
    res.json({ success: true, published: data.published });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// SETTINGS API
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// DEPLOY API
// ─────────────────────────────────────────────

app.post('/api/deploy', async (req, res) => {
  try {
    const webhookUrl = process.env.DEPLOY_WEBHOOK_URL;
    const localRebuild = process.env.LOCAL_REBUILD === 'true';

    // Always trigger local Gatsby hot-refresh
    await triggerLocalGatsbyRefresh();

    if (localRebuild) {
      if (isRebuilding) {
        return res.status(409).json({
          success: false,
          error: 'A site rebuild is already in progress. Please wait a moment.',
        });
      }

      isRebuilding = true;
      console.log('[Deploy] Starting local Gatsby production rebuild...');

      exec(
        'npm run build',
        { cwd: PORTFOLIO_ROOT, maxBuffer: 20 * 1024 * 1024 },
        (buildErr, stdout, stderr) => {
          isRebuilding = false;
          if (buildErr) {
            console.error('[Deploy] Build failed:', stderr || buildErr.message);
            return res.status(500).json({
              success: false,
              error: `Rebuild failed: ${buildErr.message}`,
            });
          }

          console.log('[Deploy] Gatsby rebuild completed.');

          if (process.env.GIT_AUTO_PUSH === 'true') {
            exec(
              'git add -A && (git commit -m "Content update from CMS" || true) && (git push origin main || true)',
              { cwd: PORTFOLIO_ROOT },
              (gitErr) => {
                if (gitErr) console.warn('[Deploy] Optional git push warning:', gitErr.message);
              }
            );
          }

          return res.json({
            success: true,
            message: 'Site rebuilt and published live!',
          });
        }
      );
      return;
    }

    // Default mode: Commit and push changes to git + optional webhook
    exec(
      'git add -A && (git commit -m "Content update from CMS" || true) && git push origin main && (git push vercel-repo main || true)',
      { cwd: PORTFOLIO_ROOT },
      (error, stdout, stderr) => {
        console.log("Git deploy output:", stdout, stderr);
        if (error) {
          console.warn("Git push warning:", error.message);
        }

        if (!webhookUrl) {
          return res.json({
            success: true,
            message: 'Changes committed & pushed to GitHub! Local Gatsby cache updated.'
          });
        }

        console.log(`Triggering deploy webhook: ${webhookUrl}`);
        fetch(webhookUrl, { method: 'POST' })
          .then(response => {
            if (response.ok) {
              res.json({ success: true, message: 'Deployment triggered successfully! Your live site will update shortly.' });
            } else {
              res.json({ success: true, message: `Git push completed! Webhook status: ${response.status}` });
            }
          })
          .catch(err => {
            res.json({ success: true, message: `Git push completed! (Webhook note: ${err.message})` });
          });
      }
    );
  } catch (err) {
    isRebuilding = false;
    console.error(`Deploy error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// FEATURED PROJECTS API
// ─────────────────────────────────────────────

app.get('/api/featured', async (req, res) => {
  try {
    if (!fs.existsSync(FEATURED_DIR)) fs.mkdirSync(FEATURED_DIR, { recursive: true });
    const slugs = fs.readdirSync(FEATURED_DIR).filter(f => fs.statSync(path.join(FEATURED_DIR, f)).isDirectory());
    const projects = slugs.map(slug => parseFeaturedProject(slug)).filter(Boolean);
    projects.sort((a, b) => Number(a.date) - Number(b.date));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/featured/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
    for (let i = 0; i < order.length; i++) {
      const slug = order[i];
      const project = parseFeaturedProject(slug);
      if (project) {
        project.date = String(i + 1);
        writeFeaturedMarkdown(path.join(FEATURED_DIR, slug), project);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/featured/:slug/cover', (req, res) => {
  try {
    const slug = req.params.slug;
    const dir = path.join(FEATURED_DIR, slug);
    if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Not found' });
    const project = parseFeaturedProject(slug);
    let coverFile = project && project.cover ? project.cover : null;
    if (coverFile && coverFile.startsWith('./')) {
      coverFile = coverFile.slice(2);
    }
    if (coverFile && fs.existsSync(path.join(dir, coverFile))) {
      return res.sendFile(path.join(dir, coverFile));
    }
    const coverImage = findCoverImage(dir);
    if (!coverImage) return res.status(404).json({ error: 'No cover image' });
    res.sendFile(path.join(dir, coverImage));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/featured', upload.single('cover'), async (req, res) => {
  try {
    const { title, role, description, tech, cta, external, button } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(FEATURED_DIR, slug);
    if (fs.existsSync(dir)) return res.status(400).json({ error: 'Already exists' });
    fs.mkdirSync(dir, { recursive: true });
    
    let coverPath = './cover.webp';
    if (req.file) coverPath = req.file.path || req.file.secure_url;
    
    const count = fs.readdirSync(FEATURED_DIR).filter(f => fs.statSync(path.join(FEATURED_DIR, f)).isDirectory()).length;
    
    const data = {
      date: String(count + 1),
      title,
      slug,
      cover: coverPath,
      cta: cta || '',
      external: external || '',
      button: button || 'Read More',
      role: role || '',
      tech: tech ? (typeof tech === 'string' ? JSON.parse(tech) : tech) : [],
      description: description || '',
      published: true,
    };
    
    writeFeaturedMarkdown(dir, data);
    res.json({ success: true, project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/featured/:slug', upload.single('cover'), async (req, res) => {
  try {
    const { slug } = req.params;
    const dir = path.join(FEATURED_DIR, slug);
    const project = parseFeaturedProject(slug);
    if (!project) return res.status(404).json({ error: 'Not found' });
    
    let coverPath = project.cover;
    if (req.file) {
      coverPath = req.file.path || req.file.secure_url;
    } else if (req.body.deleteCover === 'true') {
      coverPath = '';
    }
    
    const { title, role, description, tech, cta, external, button } = req.body;
    
    const update = {
      title: title || project.title,
      cover: coverPath,
      cta: cta !== undefined ? cta : project.cta,
      external: external !== undefined ? external : project.external,
      button: button || project.button,
      role: role !== undefined ? role : project.role,
      tech: tech ? (typeof tech === 'string' ? JSON.parse(tech) : tech) : project.tech,
      description: description !== undefined ? description : project.description,
      date: project.date,
      published: project.published,
    };
    
    let newSlug = slug;
    if (title && title !== project.title) newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    if (newSlug !== slug) {
      const newDir = path.join(FEATURED_DIR, newSlug);
      writeFeaturedMarkdown(dir, update);
      fs.renameSync(dir, newDir);
    } else {
      writeFeaturedMarkdown(dir, update);
    }
    
    update.slug = newSlug;
    res.json({ success: true, project: update });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/featured/:slug', async (req, res) => {
  try {
    const dir = path.join(FEATURED_DIR, req.params.slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      await triggerLocalGatsbyRefresh();
      res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/featured/:slug/toggle-publish', async (req, res) => {
  try {
    const dir = path.join(FEATURED_DIR, req.params.slug);
    const project = parseFeaturedProject(req.params.slug);
    if (!project) return res.status(404).json({ error: 'Not found' });
    project.published = !project.published;
    writeFeaturedMarkdown(dir, project);
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
// JOBS API
// ─────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
    const slugs = fs.readdirSync(JOBS_DIR).filter(f => fs.statSync(path.join(JOBS_DIR, f)).isDirectory());
    const jobs = slugs.map(slug => parseJob(slug)).filter(Boolean);
    jobs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
    const baseDate = new Date('2025-01-01');
    for (let i = 0; i < order.length; i++) {
      const slug = order[i];
      const job = parseJob(slug);
      if (job) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        job.date = d.toISOString().split('T')[0];
        writeJobMarkdown(path.join(JOBS_DIR, slug), job);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, location, range, url, description, date } = req.body;
    const slug = (company || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(JOBS_DIR, slug);
    if (fs.existsSync(dir)) return res.status(400).json({ error: 'Already exists' });
    fs.mkdirSync(dir, { recursive: true });

    const data = {
      date: date || new Date().toISOString().split('T')[0],
      title,
      company: company || slug,
      slug,
      location: location || '',
      range: range || '',
      url: url || '#',
      description: description || '',
      published: true,
    };
    writeJobMarkdown(dir, data);
    res.json({ success: true, job: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const dir = path.join(JOBS_DIR, slug);
    const job = parseJob(slug);
    if (!job) return res.status(404).json({ error: 'Not found' });

    const { title, company, location, range, url, description, date } = req.body;
    
    const update = {
      date: date || job.date,
      title: title !== undefined ? title : job.title,
      company: company !== undefined ? company : job.company,
      location: location !== undefined ? location : job.location,
      range: range !== undefined ? range : job.range,
      url: url !== undefined ? url : job.url,
      description: description !== undefined ? description : job.description,
      published: job.published,
    };
    
    let newSlug = slug;
    if (company && company !== job.company) newSlug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    if (newSlug !== slug) {
      const newDir = path.join(JOBS_DIR, newSlug);
      writeJobMarkdown(dir, update);
      fs.renameSync(dir, newDir);
    } else {
      writeJobMarkdown(dir, update);
    }
    
    update.slug = newSlug;
    res.json({ success: true, job: update });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:slug', async (req, res) => {
  try {
    const dir = path.join(JOBS_DIR, req.params.slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      await triggerLocalGatsbyRefresh();
      res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs/:slug/toggle-publish', async (req, res) => {
  try {
    const dir = path.join(JOBS_DIR, req.params.slug);
    const job = parseJob(req.params.slug);
    if (!job) return res.status(404).json({ error: 'Not found' });
    job.published = !job.published;
    writeJobMarkdown(dir, job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// RESUME API
// ─────────────────────────────────────────────



app.post('/api/resume/upload', uploadResume.single('resume'), async (req, res) => {
  try {
    const resumeUrl = req.file.path || req.file.secure_url;
    res.json({ success: true, url: resumeUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// HERO & ABOUT API
// ─────────────────────────────────────────────

app.get('/api/homepage/hero', async (req, res) => {
  try {
    const filePath = path.join(HERO_DIR, 'hero.json');
    if (!fs.existsSync(filePath)) return res.json({});
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/homepage/hero', async (req, res) => {
  try {
    if (!fs.existsSync(HERO_DIR)) fs.mkdirSync(HERO_DIR, { recursive: true });
    fs.writeFileSync(path.join(HERO_DIR, 'hero.json'), JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/homepage/about', async (req, res) => {
  try {
    const filePath = path.join(ABOUT_DIR, 'about.json');
    if (!fs.existsSync(filePath)) return res.json({});
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/homepage/about', async (req, res) => {
  try {
    if (!fs.existsSync(ABOUT_DIR)) fs.mkdirSync(ABOUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(ABOUT_DIR, 'about.json'), JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// CASE STUDIES API
// ─────────────────────────────────────────────

app.get('/api/case-studies', async (req, res) => {
  try {
    if (!fs.existsSync(CASE_STUDIES_DIR)) fs.mkdirSync(CASE_STUDIES_DIR, { recursive: true });
    const slugs = fs.readdirSync(CASE_STUDIES_DIR).filter(f => fs.statSync(path.join(CASE_STUDIES_DIR, f)).isDirectory());
    const studies = slugs.map(slug => parseCaseStudy(slug)).filter(Boolean);
    studies.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(studies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/case-studies/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
    const baseDate = new Date('2025-01-01');
    for (let i = 0; i < order.length; i++) {
      const slug = order[i];
      const study = parseCaseStudy(slug);
      if (study) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        study.date = d.toISOString().split('T')[0];
        writeCaseStudyMarkdown(path.join(CASE_STUDIES_DIR, slug), study);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/case-studies', async (req, res) => {
  try {
    const { title, date, project_type } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dir = path.join(CASE_STUDIES_DIR, slug);
    if (fs.existsSync(dir)) return res.status(400).json({ error: 'Already exists' });
    
    const data = {
      title,
      slug,
      date: date || new Date().toISOString().split('T')[0],
      published: true,
      project_type: project_type || 'case-study'
    };
    writeCaseStudyMarkdown(dir, data);
    res.json({ success: true, caseStudy: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/case-studies/:slug', async (req, res) => {
  try {
    let { slug } = req.params;
    let dir = path.join(CASE_STUDIES_DIR, slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let { blocks, published, title, summary, details, banner, newSlug, project_type, ai_label, labels, cta_button } = req.body;

    if (newSlug && newSlug !== slug) {
      const newDir = path.join(CASE_STUDIES_DIR, newSlug);
      if (fs.existsSync(newDir)) {
        return res.status(400).json({ error: 'Case study with this slug already exists' });
      }
      fs.renameSync(dir, newDir);
      
      const mediaDir = path.join(STATIC_DIR, 'uploads', 'case-studies', slug);
      const newMediaDir = path.join(STATIC_DIR, 'uploads', 'case-studies', newSlug);
      if (fs.existsSync(mediaDir)) {
        if (!fs.existsSync(path.dirname(newMediaDir))) fs.mkdirSync(path.dirname(newMediaDir), { recursive: true });
        fs.renameSync(mediaDir, newMediaDir);
      }
      
      const oldPath = `/uploads/case-studies/${slug}/`;
      const newPath = `/uploads/case-studies/${newSlug}/`;
      
      if (banner && banner.includes(oldPath)) {
        banner = banner.replace(oldPath, newPath);
      }
      if (blocks) {
        const blocksStr = JSON.stringify(blocks).split(oldPath).join(newPath);
        blocks = JSON.parse(blocksStr);
      }
      
      slug = newSlug;
      dir = newDir;
    }

    let study = parseCaseStudy(slug);
    if (!study) {
      study = { title: title || slug, slug, date: new Date().toISOString().split('T')[0] };
    }

    // Helper for base64
    const saveBase64Image = (dataUri) => {
      const match = dataUri.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!match) return dataUri;
      let ext = 'png';
      if (match[1].includes('jpeg') || match[1].includes('jpg')) ext = 'jpg';
      else if (match[1].includes('gif')) ext = 'gif';
      else if (match[1].includes('webp')) ext = 'webp';
      else if (match[1].includes('mp4')) ext = 'mp4';
      
      const buffer = Buffer.from(match[2], 'base64');
      const filename = `img-${Date.now()}-${Math.floor(Math.random()*1000)}.${ext}`;
      const fullPath = path.join(STATIC_DIR, 'uploads', 'case-studies', slug);
      if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
      fs.writeFileSync(path.join(fullPath, filename), buffer);
      return `/uploads/case-studies/${slug}/${filename}`;
    };

    let bannerPath = banner || '';
    if (bannerPath.startsWith('data:')) {
      bannerPath = saveBase64Image(bannerPath);
    }

    let markdown = ``;
    const savedBlocks = JSON.parse(JSON.stringify(blocks || [])); 
    const derivedTocItems = [];
    
    for (let block of savedBlocks) {
      if (block.type === 'text') {
        let content = block.content;
        if (block.tocEntry) {
          const anchor = (block.tocName || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          if (content.includes('<h2')) {
            const tocNameAttr = (block.tocName || 'Section').replace(/"/g, '&quot;');
            content = content.replace(/<h2([^>]*)>/, `<h2 id="${anchor}" data-toc-name="${tocNameAttr}"$1>`);
          }
          derivedTocItems.push({ text: block.tocName || 'Section', anchor: anchor });
        }
        markdown += `${content.trim()}\n\n`;
      } else if (block.type === 'image') {
        markdown += `\n<div class="grid grid-${block.grid}">\n\n`;
        for (let i = 0; i < block.images.length; i++) {
          let img = block.images[i];
          if (img.startsWith('data:')) {
            const publicPath = saveBase64Image(img);
            markdown += `![Image](${publicPath})\n\n`;
            block.images[i] = publicPath;
          } else {
            markdown += `![Image](${img})\n\n`;
          }
        }
        markdown += `</div>\n\n`;
      } else if (block.type === 'cards') {
        markdown += `\n<div class="cards-grid cards-grid-${block.grid}">\n`;
        for (let card of block.cards) {
          // Wrap heading in h3 and text in p
          const styles = [];
          if (card.color && card.color !== '#64ffda') {
            styles.push(`color:${card.color}`);
          }
          if (card.fontSize) {
            styles.push(`font-size:${card.fontSize}`);
          }
          const inlineStyle = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
          markdown += `  <div class="card">\n    <h3${inlineStyle}>${card.heading}</h3>\n    <p>${card.text}</p>\n  </div>\n`;
        }
        markdown += `</div>\n\n`;
      } else if (block.type === 'callout') {
        markdown += `\n<div class="callout-block">\n  <h3>${block.heading}</h3>\n  <div class="callout-content">\n${block.content.trim()}\n  </div>\n</div>\n\n`;
      } else if (block.type === 'button') {
        const text = (block.text || 'View Project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const url = block.url || '#';
        const align = block.align || 'center';
        const styleVariant = block.styleVariant || 'outline';
        const fontSize = block.fontSize || '14px';
        const borderRadius = block.borderRadius || '4px';
        const borderWidth = block.borderWidth || '1px';
        const borderStyle = block.borderStyle || 'solid';
        const color = block.color || '#64ffda';
        const target = block.newTab !== false ? ' target="_blank" rel="noopener noreferrer"' : '';

        const isFilled = styleVariant === 'filled';
        const borderProp = borderStyle === 'none' ? 'none' : `${borderWidth} ${borderStyle} ${color}`;
        const bgProp = isFilled ? color : 'transparent';
        const textProp = isFilled ? '#0a192f' : color;
        const alignStyle = align === 'left' ? 'text-align: left;' : align === 'right' ? 'text-align: right;' : 'text-align: center;';

        const styles = [
          'display: inline-flex',
          'align-items: center',
          'justify-content: center',
          'gap: 8px',
          'text-decoration: none',
          'font-family: var(--font-mono, monospace)',
          `font-size: ${fontSize}`,
          'font-weight: 500',
          'line-height: 1',
          'padding: 1.15rem 2.2rem',
          `border-radius: ${borderRadius}`,
          `color: ${textProp}`,
          `background-color: ${bgProp}`,
          `border: ${borderProp}`,
          'white-space: nowrap',
          'max-width: 100%',
          'box-sizing: border-box',
          'transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1)',
          'cursor: pointer'
        ];

        markdown += `\n<div class="cta-button-container" style="margin: 36px 0; ${alignStyle}">\n  <a href="${url}" class="case-study-cta-btn ${styleVariant === 'filled' ? 'btn-filled' : 'btn-outline'}"${target} style="${styles.join('; ')}">\n    <span style="white-space: nowrap; display: inline-block; line-height: 1;">${text}</span>\n    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px !important; height: 15px !important; min-width: 15px !important; max-width: 15px !important; flex-shrink: 0 !important; fill: none !important; stroke: currentColor !important; display: inline-block !important; vertical-align: middle !important;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>\n  </a>\n</div>\n\n`;
      }
    }

    const update = {
      title: title || study.title,
      date: study.date,
      summary: summary || '',
      details: details || study.details || [],
      banner: bannerPath,
      toc_enabled: derivedTocItems.length > 0,
      toc_items: derivedTocItems,
      markdown: markdown,
      published: published !== undefined ? published : study.published,
      project_type: project_type || study.project_type || 'case-study',
      ai_label: ai_label !== undefined ? ai_label : (study.ai_label || 'AI LAB'),
      labels: labels !== undefined ? labels : (study.labels || []),
      cta_button: cta_button !== undefined ? cta_button : (study.cta_button || null),
    };
    
    writeCaseStudyMarkdown(dir, update);
    
    update.slug = newSlug || slug;
    
    // Save blocks.json to the NEW dir
    const finalDir = path.join(CASE_STUDIES_DIR, newSlug || slug);
    fs.writeFileSync(path.join(finalDir, 'blocks.json'), JSON.stringify(savedBlocks, null, 2));

    res.json({ success: true, caseStudy: update });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/case-studies/:slug', async (req, res) => {
  try {
    const study = parseCaseStudy(req.params.slug);
    if (!study) return res.status(404).json({ error: 'Not found' });
    
    const dir = path.join(CASE_STUDIES_DIR, req.params.slug);
    let blocks = [];
    const blocksFile = path.join(dir, 'blocks.json');
    if (fs.existsSync(blocksFile)) {
      const parsed = JSON.parse(fs.readFileSync(blocksFile, 'utf-8'));
      blocks = Array.isArray(parsed) ? parsed : (parsed.blocks || []);
    } else if (study.markdown) {
      blocks = [{ id: Date.now().toString(), type: 'text', content: study.markdown }];
    }
    console.log("Blocks type before res.json:", Array.isArray(blocks));

    res.json({ blocks, metadata: study, frontmatter: study });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/case-studies/:slug', async (req, res) => {
  try {
    const dir = path.join(CASE_STUDIES_DIR, req.params.slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      await triggerLocalGatsbyRefresh();
      res.json({ success: true });
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/case-studies/:slug/toggle-publish', async (req, res) => {
  try {
    const dir = path.join(CASE_STUDIES_DIR, req.params.slug);
    const study = parseCaseStudy(req.params.slug);
    if (!study) return res.status(404).json({ error: 'Not found' });
    study.published = !study.published;
    writeCaseStudyMarkdown(dir, study);
    res.json({ success: true, caseStudy: study });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/case-studies/:slug/assets', async (req, res) => {
  try {
    const dir = path.join(CASE_STUDIES_DIR, req.params.slug);
    if (!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir);
    const images = files.filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)).map(f => `/api/case-studies/${req.params.slug}/assets/${f}`);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/case-studies/:slug/upload-asset', upload.single('asset'), async (req, res) => {
  try {
    const dir = path.join(CASE_STUDIES_DIR, req.params.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Using cloudinary from multer directly? Wait, the cloudinary storage is already configured.
    // The req.file.path or secure_url is returned from Cloudinary!
    if (req.file) {
       res.json({ success: true, url: req.file.path || req.file.secure_url });
    } else {
       res.status(400).json({ error: 'No file uploaded' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



if (require.main === module || !process.env.VERCEL) {
  const server = app.listen(PORT, () => console.log(`Admin API running on port ${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Admin API] Port ${PORT} is already in use by another process.`);
    } else {
      console.error('[Admin API] Server error:', err);
    }
  });
}

module.exports = app;
