import os
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Simple in-memory cache
cache = {
    "data": None,
    "last_fetched": None
}

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    all_updates = []
    
    for entry_idx, entry in enumerate(entries):
        date = entry.find('atom:title', ns).text
        updated = entry.find('atom:updated', ns).text
        
        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_type = "Update"
        current_siblings = []
        
        def push_update(u_type, siblings, idx):
            if not siblings:
                return
            html_content = "".join(str(s) for s in siblings)
            text_content = "".join(s.get_text() for s in siblings).strip()
            
            # Clean up whitespace
            text_content = " ".join(text_content.split())
            
            all_updates.append({
                "id": f"{entry_idx}_{idx}",
                "date": date,
                "updated": updated,
                "type": u_type,
                "html": html_content,
                "text": text_content,
                "link": link
            })

        update_idx = 0
        for child in soup.children:
            if child.name in ['h3', 'h4']:
                if current_siblings:
                    push_update(current_type, current_siblings, update_idx)
                    update_idx += 1
                    current_siblings = []
                current_type = child.get_text().strip()
            elif child.name:
                current_siblings.append(child)
        
        if current_siblings:
            push_update(current_type, current_siblings, update_idx)
            
    return all_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if force_refresh or cache["data"] is None:
        try:
            updates = fetch_and_parse_feed()
            cache["data"] = updates
            from datetime import datetime
            cache["last_fetched"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        except Exception as e:
            # If fetch fails and we have cache, return cache with a warning
            if cache["data"] is not None:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "updates": cache["data"],
                    "last_fetched": cache["last_fetched"]
                }), 200
            return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({
        "success": True,
        "updates": cache["data"],
        "last_fetched": cache["last_fetched"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
