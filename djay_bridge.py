import os
import time
import sqlite3
import json
from pathlib import Path

# Diccionario corregido (0-based index)
DJAY_KEY_MAP = {
    0: "8B", 1: "5A", 2: "3B", 3: "12A", 4: "10B", 5: "7A",
    6: "5B", 7: "2A", 8: "12B", 9: "9A", 10: "7B", 11: "4A",
    12: "2B", 13: "11A", 14: "9B", 15: "6A", 16: "4B", 17: "1A",
    18: "11B", 19: "8A", 20: "6B", 21: "3A", 22: "1B", 23: "10A"
}

def get_djay_track():
    package_path = os.path.expanduser("~/Music/djay/djay Media Library.djayMediaLibrary")
    db_path = os.path.join(package_path, "MediaLibrary.db")
    
    if not os.path.exists(db_path):
        return None

    try:
        conn = sqlite3.connect(db_path, timeout=5.0)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT f.docid, f.c0title, f.c1artist, 
                   COALESCE(a.bpm, i.bpm) as bpm, 
                   COALESCE(a.keySignatureIndex, i.musicalKeySignatureIndex) as keyIndex
            FROM fts_searchIndex_content f
            LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
            LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
        """)
        
        library = []
        for row in cursor.fetchall():
            if row[1] and row[2]:
                bpm_raw = row[3]
                bpm_val = float(bpm_raw) if bpm_raw is not None else 0.0
                key_idx = row[4]
                
                library.append({
                    "id": str(row[0]),
                    "title": row[1].strip(),
                    "artist": row[2].strip(),
                    "bpm": bpm_val,
                    "key": DJAY_KEY_MAP.get(key_idx, "8A") if key_idx is not None else "8A"
                })
        
        cursor.execute("SELECT data, metadata FROM database2 ORDER BY rowid DESC LIMIT 15")
        
        for row in cursor.fetchall():
            row_text = ""
            if row[0]: row_text += row[0].decode('utf-8', 'ignore')
            if row[1]: row_text += row[1].decode('utf-8', 'ignore')
            
            if len(row_text) < 10: 
                continue
                
            matches = []
            for track in library:
                if len(track["title"]) > 2 and len(track["artist"]) > 2:
                    if track["title"] in row_text and track["artist"] in row_text:
                        matches.append(track)
                        
            if matches:
                conn.close()
                matches.sort(key=lambda x: len(x["title"]), reverse=True)
                best = matches[0]
                
                final_bpm = best["bpm"] if best["bpm"] > 0 else 126.0
                return {
                    "id": best["id"],
                    "title": best["title"],
                    "artist": best["artist"],
                    "bpm": round(final_bpm, 1),
                    "key": best["key"],
                    "energy": 7,
                    "rating": 5
                }
                        
        conn.close()
    except Exception:
        pass
        
    return None

def main():
    print("🎧 Iniciando Pulse DJ Bridge (Match Total)...")
    out_dir = os.path.expanduser("~/Music/PulseDJ")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "now_playing.json")
    
    last_id = None

    while True:
        track = get_djay_track()
        
        if track and track["id"] != last_id:
            last_id = track["id"]
            
            try:
                with open(out_file, "w") as f:
                    json.dump(track, f)
                print(f"🎵 En vivo: {track['title']} - {track['artist']} [{track['key']} | {track['bpm']} BPM]")
            except Exception:
                pass
            
        time.sleep(1.0)

if __name__ == "__main__":
    main()