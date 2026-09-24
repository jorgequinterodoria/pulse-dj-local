import os
import sqlite3
from pathlib import Path

# Diccionario corregido (0-based index): Mapeo exacto del motor zplane de djay Pro a Camelot
DJAY_KEY_MAP = {
    0: "8B", 1: "5A", 2: "3B", 3: "12A", 4: "10B", 5: "7A",
    6: "5B", 7: "2A", 8: "12B", 9: "9A", 10: "7B", 11: "4A",
    12: "2B", 13: "11A", 14: "9B", 15: "6A", 16: "4B", 17: "1A",
    18: "11B", 19: "8A", 20: "6B", 21: "3A", 22: "1B", 23: "10A"
}

def import_djay_library():
    djay_db_path = os.path.expanduser("~/Music/djay/djay Media Library.djayMediaLibrary/MediaLibrary.db")
    pulse_db_path = os.path.expanduser("~/Music/PulseDJ/library.sqlite")
    
    if not os.path.exists(djay_db_path):
        return
        
    print("🔄 Sanando tonalidades (Offset 0): Extrayendo datos de djay Pro...")
    
    try:
        djay_uri = f"{Path(djay_db_path).as_uri()}?mode=ro"
        djay_conn = sqlite3.connect(djay_uri, uri=True)
        djay_cursor = djay_conn.cursor()
        
        djay_cursor.execute("""
            SELECT f.docid, f.c0title, f.c1artist, 
                   COALESCE(a.bpm, i.bpm) as bpm, 
                   COALESCE(a.keySignatureIndex, i.musicalKeySignatureIndex) as keyIndex
            FROM fts_searchIndex_content f
            LEFT JOIN secondaryIndex_mediaItemAnalyzedDataIndex a ON f.docid = a.rowid
            LEFT JOIN secondaryIndex_mediaItemIndex i ON f.docid = i.rowid
        """)
        
        tracks = djay_cursor.fetchall()
        djay_conn.close()
        
        pulse_conn = sqlite3.connect(pulse_db_path)
        pulse_cursor = pulse_conn.cursor()
        
        imported = 0
        for row in tracks:
            docid, title, artist, bpm, key_idx = row
            if title and artist:
                bpm_val = round(float(bpm) if bpm is not None else 126.0, 1)
                assigned_key = DJAY_KEY_MAP.get(key_idx, "8A") if key_idx is not None else "8A"
                
                try:
                    pulse_cursor.execute("""
                        INSERT INTO tracks (id, title, artist, bpm, key, energy, rating) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET 
                            title=excluded.title, 
                            artist=excluded.artist, 
                            bpm=excluded.bpm,
                            key=excluded.key
                    """, (str(docid), title.strip(), artist.strip(), bpm_val, assigned_key, 7, 5))
                    imported += 1
                except Exception:
                    pass
                    
        pulse_conn.commit()
        pulse_conn.close()
        
        print(f"🎉 Corrección completada: {imported} pistas actualizadas con las tonalidades reales.")
        
    except Exception as e:
        print(f"❌ Error durante la importación: {e}")

if __name__ == "__main__":
    import_djay_library()