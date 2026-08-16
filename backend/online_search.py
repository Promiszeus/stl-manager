import requests
import lxml.html
import urllib.parse
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, application/xhtml+xml, */*",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

# Simple in-memory search cache to avoid rate limits
SEARCH_CACHE = {}
CACHE_TTL = 300  # 5 minutes

def get_cached(query: str, platforms_key: str, page: int):
    key = f"{query.lower().strip()}_{platforms_key}_{page}"
    if key in SEARCH_CACHE:
        item = SEARCH_CACHE[key]
        if time.time() - item["time"] < CACHE_TTL:
            return item["data"]
    return None

def set_cached(query: str, platforms_key: str, page: int, data):
    key = f"{query.lower().strip()}_{platforms_key}_{page}"
    SEARCH_CACHE[key] = {
        "time": time.time(),
        "data": data
    }
    # Keep cache from growing indefinitely
    if len(SEARCH_CACHE) > 200:
        oldest = min(SEARCH_CACHE.keys(), key=lambda k: SEARCH_CACHE[k]["time"])
        del SEARCH_CACHE[oldest]

def normalize_model_url(platform: str, model_id, raw_url: str):
    """Ensure URLs link directly to the model page rather than the platform homepage."""
    mid = str(model_id).strip() if model_id else ""
    url = str(raw_url).strip() if raw_url else ""
    
    # 1. MakerWorld: Must have /en/models/ID or /de/models/ID
    if platform in ("makerworld", "maker_world"):
        if re.search(r'makerworld\.com/models/\d+', url):
            return url.replace("makerworld.com/models/", "makerworld.com/en/models/")
        if "/en/models/" in url or "/de/models/" in url:
            return url
        if mid and mid.isdigit():
            return f"https://makerworld.com/en/models/{mid}"
        if url.startswith("http") and url not in ("https://makerworld.com", "https://makerworld.com/"):
            return url
        return f"https://makerworld.com/en/models/{mid}" if mid else "https://makerworld.com"

    # 2. Printables: Must have /model/ID
    elif platform in ("printables", "prusa"):
        if "/model/" in url:
            return url
        if mid:
            return f"https://www.printables.com/model/{mid}"
        return url or "https://www.printables.com"

    # 3. Thingiverse: Must have /thing:ID
    elif platform in ("thingiverse", "thing"):
        if "/thing:" in url or "/thing/" in url:
            return url
        if mid:
            return f"https://www.thingiverse.com/thing:{mid}"
        return url or "https://www.thingiverse.com"

    # 4. Cults 3D: Must have /en/3d-model/...
    elif platform in ("cults", "cults3d"):
        if "/3d-model/" in url:
            if not url.startswith("http"):
                url = f"https://cults3d.com{url}"
            return url
        if mid and not mid.isdigit():
            return f"https://cults3d.com/en/3d-model/{mid}"
        return url or "https://cults3d.com"

    # 5. MakerOnline
    elif platform in ("makeronline", "maker_online"):
        if url.startswith("http") and ".html" in url:
            return url
        if mid:
            return f"https://www.makeronline.com/model/{mid}"
        return url or "https://www.makeronline.com"

    # 6. Creality Cloud
    elif platform in ("crealitycloud", "creality", "cratly"):
        if "/model-detail/" in url:
            return url
        if mid:
            return f"https://www.crealitycloud.com/model-detail/{mid}"
        return url or "https://www.crealitycloud.com"

    return url

def normalize_thumbnail_url(thumb: str) -> str:
    """Unwraps proxy URLs (like image.three-drop.com and resize.thingiverse.com) into clean, direct CDN image URLs."""
    if not thumb:
        return ""
    url = str(thumb).strip()
    
    # 1. Unwrap three-drop proxy
    if "image.three-drop.com/" in url:
        part = url.split("image.three-drop.com/", 1)[1]
        url = urllib.parse.unquote(part)

    # 2. Unwrap resize.thingiverse.com
    if "resize.thingiverse.com" in url and "url=" in url:
        m = re.search(r'url=([^&]+)', url)
        if m:
            url = urllib.parse.unquote(m.group(1))

    # 3. Double-unquote if needed
    if url.startswith("http%3A") or url.startswith("https%3A"):
        url = urllib.parse.unquote(url)

    return url

def search_cults3d_direct(query: str, limit: int = 24):
    """Direct scraper for Cults3D search."""
    results = []
    try:
        url = f"https://cults3d.com/en/search?q={urllib.parse.quote(query)}"
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            tree = lxml.html.fromstring(resp.content)
            articles = tree.xpath("//article")
            for a in articles[:limit]:
                try:
                    link_elem = a.xpath(".//a[contains(@href, '/3d-model/')] | .//a[contains(@class, 'tbox-thumb')] | .//a[contains(@class, 'crea-title')]")
                    if not link_elem:
                        continue
                    
                    href = link_elem[0].get("href", "")
                    title = link_elem[0].get("title", "") or link_elem[0].text_content().strip()
                    if not href or not title:
                        continue
                    if not href.startswith("http"):
                        href = f"https://cults3d.com{href}"

                    img_elem = a.xpath(".//img | .//source")
                    thumb = ""
                    if img_elem:
                        thumb = (img_elem[0].get("data-srcset") or 
                                 img_elem[0].get("srcset") or 
                                 img_elem[0].get("data-src") or 
                                 img_elem[0].get("src") or "")
                        if "," in thumb:
                            thumb = thumb.split(",")[-1].strip().split(" ")[0]

                    author_elem = a.xpath(".//a[contains(@class, 'author')] | .//a[contains(@class, 'user')]")
                    author = author_elem[0].text_content().strip() if author_elem else "Cults Designer"

                    price_elem = a.xpath(".//*[contains(@class, 'price') or contains(@class, 'tag--free')]")
                    is_free = True
                    price_str = None
                    if price_elem:
                        p_text = price_elem[0].text_content().strip().lower()
                        if "free" not in p_text and "gratuit" not in p_text and "kostenlos" not in p_text and p_text:
                            is_free = False
                            price_str = price_elem[0].text_content().strip()

                    match = re.search(r'/([^/]+)$', href)
                    cults_id = match.group(1) if match else str(hash(href))
                    direct_url = normalize_model_url("cults3d", cults_id, href)

                    results.append({
                        "id": f"cults_{cults_id}",
                        "title": title,
                        "platform": "cults3d",
                        "platform_name": "Cults 3D",
                        "url": direct_url,
                        "thumbnail": thumb,
                        "author": author,
                        "likes": 0,
                        "downloads": 0,
                        "is_free": is_free,
                        "price": price_str
                    })
                except Exception:
                    continue
    except Exception as e:
        print(f"Cults3D search error: {e}")
    return results

def search_threedrop_api(query: str, page: int = 1, sort: str = "popular"):
    """Query 3Drop aggregated search endpoint across multiple subpages in parallel (covers MakerWorld, Printables, Thingiverse, MakerOnline, Creality)."""
    results = []
    try:
        # Step 1: get dynamic path
        endpoint_res = requests.get("https://three-drop.com/api/search-endpoint", headers=HEADERS, timeout=6)
        if endpoint_res.status_code != 200:
            return results
        path = endpoint_res.json().get("path")
        if not path:
            return results

        # Step 2: query 4 subpages in parallel for high volume of results
        start_sp = (page - 1) * 4 + 1
        subpages = [start_sp, start_sp + 1, start_sp + 2, start_sp + 3]

        def fetch_single_page(sp_num):
            try:
                sort_param = f"&sort={urllib.parse.quote(sort)}" if sort else ""
                search_url = f"https://three-drop.com{path}?query={urllib.parse.quote(query)}{sort_param}&page={sp_num}"
                search_res = requests.get(search_url, headers=HEADERS, timeout=8)
                if search_res.status_code == 200:
                    data = search_res.json()
                    return data.get("results", []) or data.get("models", []) or []
            except Exception:
                pass
            return []

        raw_items = []
        with ThreadPoolExecutor(max_workers=4) as ex:
            futs = [ex.submit(fetch_single_page, sp) for sp in subpages]
            for f in futs:
                try:
                    raw_items.extend(f.result())
                except Exception:
                    pass

        # Plat map
        plat_map = {
            "makerworld": "MakerWorld",
            "printables": "Printables",
            "thingiverse": "Thingiverse",
            "cults": "Cults 3D",
            "cults3d": "Cults 3D",
            "makeronline": "MakerOnline",
            "crealitycloud": "Creality Cloud",
            "cratly": "Creality Cloud",
            "thangs": "Thangs",
            "myminifactory": "MyMiniFactory"
        }

        for item in raw_items:
            model_id = item.get("id") or item.get("modelId")
            name = item.get("name") or item.get("title") or "Untitled"
            website_type = (item.get("websiteType") or item.get("platform") or "unknown").lower()
            
            raw_url = item.get("url") or item.get("link") or ""
            raw_image = item.get("imageUrl") or item.get("thumbnailUrl") or item.get("image") or item.get("thumbnail") or item.get("previewImage") or ""
            image = normalize_thumbnail_url(raw_image)
            author = item.get("author") or item.get("creator") or item.get("user") or "3D Creator"
            if isinstance(author, dict):
                author = author.get("name") or author.get("username") or "Creator"

            likes = item.get("likes") or item.get("likeCount") or item.get("favorites") or 0
            downloads = item.get("downloads") or item.get("downloadCount") or item.get("prints") or 0
            is_free = item.get("isFree", True)
            price = item.get("price")

            plat_code = "cults3d" if website_type == "cults" else website_type
            plat_name = plat_map.get(plat_code, website_type.capitalize())

            # Normalize URL so it always points directly to the model
            direct_url = normalize_model_url(plat_code, model_id, raw_url)

            results.append({
                "id": f"{plat_code}_{model_id}",
                "title": name,
                "platform": plat_code,
                "platform_name": plat_name,
                "url": direct_url,
                "thumbnail": image,
                "author": str(author),
                "likes": int(likes) if str(likes).isdigit() else 0,
                "downloads": int(downloads) if str(downloads).isdigit() else 0,
                "is_free": is_free,
                "price": str(price) if price else None
            })
    except Exception as e:
        print(f"3Drop API error: {e}")
    return results

def search_online_models(query: str, platforms=None, page: int = 1, sort: str = "", mode: str = ""):
    """
    Search models across MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline, Creality Cloud.
    Supports genuine platform trend feeds (mode="daily", mode="monthly", mode="newest").
    """
    effective_query = query.strip() if query else ""
    effective_sort = sort.strip() if sort else "popular"

    # Map trend modes to genuine exploration queries
    if mode == "daily" or effective_query.lower() in ("__daily__", "daily_trends"):
        effective_query = "trending"
        effective_sort = "popular"
    elif mode == "monthly" or effective_query.lower() in ("__monthly__", "monthly_trends"):
        effective_query = "featured"
        effective_sort = "popular"
    elif mode == "newest" or effective_query.lower() in ("__newest__", "newest_models"):
        effective_query = "new"
        effective_sort = "newest"
    elif not effective_query:
        effective_query = "trending"
        effective_sort = "popular"

    cache_key_query = f"{mode}:{effective_query}:{effective_sort}"
    plat_key = ",".join(sorted(platforms)) if platforms else "all"
    
    # Check cache first
    cached = get_cached(cache_key_query, plat_key, page)
    if cached is not None:
        return cached

    all_results = []
    
    # Launch parallel search workers
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_3drop = executor.submit(search_threedrop_api, effective_query, page, effective_sort)
        f_cults = executor.submit(search_cults3d_direct, effective_query, 24)

        try:
            r_3drop = f_3drop.result()
            if r_3drop:
                all_results.extend(r_3drop)
        except Exception as e:
            print(f"Error fetching 3Drop: {e}")

        try:
            r_cults = f_cults.result()
            if r_cults:
                all_results.extend(r_cults)
        except Exception as e:
            print(f"Error fetching Cults direct: {e}")

    # Deduplicate by URL or normalized Title
    seen_urls = set()
    deduped = []
    for r in all_results:
        u = r.get("url")
        if u and u not in seen_urls:
            seen_urls.add(u)
            # Filter by requested platforms if specified
            if not platforms or r.get("platform") in platforms or r.get("platform") == "all":
                deduped.append(r)

    # Sort: items with thumbnails first, then by popularity (downloads + likes)
    if effective_sort != "newest":
        deduped.sort(key=lambda x: (
            bool(x.get("thumbnail")),
            x.get("downloads", 0) + x.get("likes", 0)
        ), reverse=True)
    else:
        deduped.sort(key=lambda x: (
            bool(x.get("thumbnail")),
        ), reverse=True)

    # Save to cache
    set_cached(cache_key_query, plat_key, page, deduped)
    return deduped
