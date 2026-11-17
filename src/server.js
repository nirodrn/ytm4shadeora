import express from 'express';
import cors from 'cors';
import { Innertube, UniversalCache } from 'youtubei.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const origins = (process.env.FRONTEND_ORIGIN || '*').split(',').map((value) => value.trim());
const cacheSeconds = Number(process.env.SEARCH_CACHE_SECONDS || 60);
const cache = new Map();
let innertubePromise;

app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '32kb' }));

function getInnertube() {
  innertubePromise ||= Innertube.create({ cache: new UniversalCache(false) });
  return innertubePromise;
}

function cleanText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.text || value.toString?.() || '';
}

function getThumbnail(item) {
  return item?.best_thumbnail?.url
    || item?.thumbnail?.contents?.at(-1)?.url
    || item?.thumbnails?.at(-1)?.url
    || null;
}

function getArtist(item) {
  if (item?.artists?.length) return item.artists.map((artist) => cleanText(artist)).join(', ');
  if (item?.author) return cleanText(item.author);
  return cleanText(item?.flex_columns?.[1]);
}

function mapVideo(video) {
  const id = video.id || video.video_id || video.endpoint?.payload?.videoId;
  return {
    id,
    title: cleanText(video.title),
    artist: getArtist(video),
    duration: video.duration?.seconds || video.length_text || null,
    thumbnail: getThumbnail(video),
    url: id ? `https://www.youtube.com/watch?v=${id}` : null
  };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ytm4shadeora' }));

app.get('/api/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 30);
  if (query.length < 2) return res.status(400).json({ error: 'q must contain at least 2 characters' });

  const key = `${query.toLowerCase()}|${limit}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.value);

  try {
    const youtube = await getInnertube();
    const result = await youtube.music.search(query, { type: 'song' });
    const contents = result.songs?.contents || result.contents || [];
    const songs = contents
      .filter((item) => item.type === 'Song' || item.video_id || item.id)
      .map(mapVideo)
      .filter((song) => song.id && song.title)
      .slice(0, limit);
    const value = { query, songs };
    cache.set(key, { value, expiresAt: Date.now() + cacheSeconds * 1000 });
    res.json(value);
  } catch (error) {
    console.error('YouTube Music search failed:', error);
    res.status(502).json({ error: 'YouTube Music search is temporarily unavailable' });
  }
});

app.listen(port, () => console.log(`ytm4shadeora listening on port ${port}`));
