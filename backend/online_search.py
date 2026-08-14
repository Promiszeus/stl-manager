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
                    link_elem = a.xpath(".//a[contains(@class, 'tbox-thumb')] | .//a[contains(@class, 'crea-title')] | .//a[contains(@class, 'card-title')]")
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

                    results.append({
                        "id": f"cults_{cults_id}",
                        "title": title,
                        "platform": "cults3d",
                        "platform_name": "Cults 3D",
                        "url": href,
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

def search_threedrop_api(query: str, page: int = 1):
    """Query 3Drop aggregated search endpoint (covers MakerWorld, Printables, Thingiverse, MakerOnline, Creality)."""
    results = []
    try:
        # Step 1: get dynamic path
        endpoint_res = requests.get("https://three-drop.com/api/search-endpoint", headers=HEADERS, timeout=6)
        if endpoint_res.status_code != 200:
            return results
        path = endpoint_res.json().get("path")
        if not path:
            return results

        # Step 2: query search path
        search_url = f"https://three-drop.com{path}?query={urllib.parse.quote(query)}&page={page}"
        search_res = requests.get(search_url, headers=HEADERS, timeout=8)
        if search_res.status_code == 200:
            data = search_res.json()
            items = data.get("results", []) or data.get("models", []) or []
            for item in items:
                model_id = item.get("id") or item.get("modelId")
                name = item.get("name") or item.get("title") or "Untitled"
                website_type = (item.get("websiteType") or item.get("platform") or "unknown").lower()
                
                url = item.get("url") or item.get("link") or ""
                image = item.get("image") or item.get("thumbnail") or item.get("previewImage") or ""
                author = item.get("author") or item.get("creator") or item.get("user") or "3D Creator"
                if isinstance(author, dict):
                    author = author.get("name") or author.get("username") or "Creator"

                likes = item.get("likes") or item.get("likeCount") or item.get("favorites") or 0
                downloads = item.get("downloads") or item.get("downloadCount") or item.get("prints") or 0
                is_free = item.get("isFree", True)
                price = item.get("price")

                # Map platform codes to readable names
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
                plat_code = "cults3d" if website_type == "cults" else website_type
                plat_name = plat_map.get(plat_code, website_type.capitalize())

                results.append({
                    "id": f"{plat_code}_{model_id}",
                    "title": name,
                    "platform": plat_code,
                    "platform_name": plat_name,
                    "url": url,
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

def search_online_models(query: str, platforms=None, page: int = 1):
    """
    Search models across MakerWorld, Printables, Cults 3D, Thingiverse, MakerOnline, Creality Cloud.
    Uses multi-threading and smart caching.
    """
    if not query or not query.strip():
        return []

    query = query.strip()
    plat_key = ",".join(sorted(platforms)) if platforms else "all"
    
    # Check cache first
    cached = get_cached(query, plat_key, page)
    if cached is not None:
        return cached

    all_results = []
    
    # Launch parallel search workers
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_3drop = executor.submit(search_threedrop_api, query, page)
        f_cults = executor.submit(search_cults3d_direct, query, 24)

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
    deduped.sort(key=lambda x: (
        bool(x.get("thumbnail")),
        x.get("downloads", 0) + x.get("likes", 0)
    ), reverse=True)

    # Save to cache
    set_cached(query, plat_key, page, deduped)
    return deduped
