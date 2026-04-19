import { readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

const QIITA_TOKEN = process.env.QIITA_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const BRANCH = process.env.TARGET_BRANCH;

if (!QIITA_TOKEN) throw new Error("QIITA_TOKEN is required");
if (!REPO) throw new Error("GITHUB_REPOSITORY is required");
if (!BRANCH) throw new Error("TARGET_BRANCH is required");

const API = "https://qiita.com/api/v2";
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${QIITA_TOKEN}`,
};

function rawUrl(dir, filename) {
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${dir}/images/${filename}`;
}

function convertImages(body, dir) {
  let out = body;

  // Obsidian: ![[./images/foo.png]] or ![[foo.png]] (optional |width suffix)
  out = out.replace(/!\[\[(?:\.\/)?(?:images\/)?([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, width) => {
    const url = rawUrl(dir, name.trim());
    if (width) return `<img src="${url}" width="${width.trim()}"/>`;
    return `![](${url})`;
  });

  // Markdown: ![alt](./images/foo.png) or ![alt](images/foo.png)
  out = out.replace(/!\[([^\]]*)\]\((?:\.\/)?images\/([^)\s]+)\)/g, (_, alt, name) => {
    return `![${alt}](${rawUrl(dir, name)})`;
  });

  // HTML <img src="https://raw.githubusercontent.com/.../{branch}/..."> normalize to current branch
  out = out.replace(
    /(<img[^>]*\bsrc=["'])https:\/\/raw\.githubusercontent\.com\/[^/"']+\/[^/"']+\/(?:refs\/heads\/)?[^/"']+\/([^"']+)(["'])/g,
    (_, pre, path, post) => `${pre}https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}${post}`,
  );

  // HTML <img src="./images/..."> or "images/..."
  out = out.replace(
    /(<img[^>]*\bsrc=["'])(?:\.\/)?images\/([^"']+)(["'])/g,
    (_, pre, name, post) => `${pre}${rawUrl(dir, name)}${post}`,
  );

  return out;
}

function mapTag(t) {
  return typeof t === "string"
    ? { name: t, versions: [] }
    : { name: t.name, versions: t.versions || [] };
}

function buildCreatePayload(data, body) {
  return {
    title: data.title,
    body,
    tags: (data.tags || []).map(mapTag),
    private: data.private ?? true,
    tweet: false,
  };
}

function buildUpdatePayload(data, body) {
  const payload = {
    title: data.title,
    body,
    tags: (data.tags || []).map(mapTag),
  };
  if (data.private !== undefined) payload.private = data.private;
  return payload;
}

async function qiita(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Qiita API ${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

const articleDir = BRANCH;
const articlePath = join(process.cwd(), articleDir, "article.md");

try {
  await stat(articlePath);
} catch {
  throw new Error(
    `article.md not found at ${articleDir}/article.md (branch name must match an article folder)`,
  );
}

const raw = await readFile(articlePath, "utf8");
const parsed = matter(raw);

if (!parsed.data.title) throw new Error("frontmatter 'title' is required");

const converted = convertImages(parsed.content, articleDir);

const id = parsed.data.qiita_id;
let result;
if (id) {
  console.log(`[update] ${articleDir} → ${id}`);
  result = await qiita("PATCH", `/items/${id}`, buildUpdatePayload(parsed.data, converted));
} else {
  console.log(`[create] ${articleDir}`);
  result = await qiita("POST", "/items", buildCreatePayload(parsed.data, converted));
  const updated = matter.stringify(parsed.content, { ...parsed.data, qiita_id: result.id });
  await writeFile(articlePath, updated);
}
console.log(`  → ${result.url}`);
