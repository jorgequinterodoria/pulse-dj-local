import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ChevronRight, Folder, RefreshCw, ChevronLeft, Sparkles, Monitor, Globe } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { emit } from '@tauri-apps/api/event';

// Helper para convertir el nombre del color a HEX
const getColorHex = (colorName: string) => {
  if (colorName === 'Blue') return '#3b82f6';
  if (colorName === 'Purple') return '#a855f7';
  return '#00e676'; // Default Green
};

export default function Settings() {
  const [view, setView] = useState<'main' | 'folders'>('main');
  
  // Estados persistentes
  const [uiColor, setUiColor] = useState(localStorage.getItem('pulse_ui_color') || 'Green');
  const [language, setLanguage] = useState(localStorage.getItem('pulse_language') || 'es');
  
  const [hintSize, setHintSize] = useState(Number(localStorage.getItem('pulse_hint_size')) || 50);
  const [miniIconSize, setMiniIconSize] = useState(Number(localStorage.getItem('pulse_icon_size')) || 50);
  const [spacing, setSpacing] = useState(Number(localStorage.getItem('pulse_spacing')) || 50);
  const [curveball, setCurveball] = useState(Number(localStorage.getItem('pulse_curveball')) || 50);

  // EMITIR CAMBIOS DE COLOR E IDIOMA A LA VENTANA PRINCIPAL EN TIEMPO REAL
  useEffect(() => {
    localStorage.setItem('pulse_ui_color', uiColor);
    localStorage.setItem('pulse_language', language);
    // Disparamos un evento nativo con los nuevos valores
    emit('settings-changed', { color: uiColor, lang: language });
  }, [uiColor, language]);

  // Guardar sliders localmente
  useEffect(() => {
    localStorage.setItem('pulse_hint_size', hintSize.toString());
    localStorage.setItem('pulse_icon_size', miniIconSize.toString());
    localStorage.setItem('pulse_spacing', spacing.toString());
    localStorage.setItem('pulse_curveball', curveball.toString());
  }, [hintSize, miniIconSize, spacing, curveball]);

  const activeHex = getColorHex(uiColor);

  if (view === 'folders') {
    return <FoldersView onBack={() => setView('main')} activeHex={activeHex} />;
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-[#e0e0e0] p-8 font-sans">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-[#2c2c2e] p-2 rounded-lg" style={{ color: activeHex }}>
          <SettingsIcon size={24} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        
        {/* COLUMNA 1: PREFERENCIAS (Solo Color de Interfaz) */}
        <div className="bg-[#252527] rounded-xl p-6 border border-[#333] h-fit">
          <h2 className="font-semibold mb-6 flex items-center text-sm" style={{ color: activeHex }}>
            <Sparkles size={16} className="mr-2" /> Preferences
          </h2>
          
          <div className="space-y-4 text-sm font-medium text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-bold">Color de interfaz</span>
              <div className="relative w-40">
                <select 
                  className="appearance-none w-full bg-[#1c1c1e] border border-[#444] rounded-md pl-3 pr-8 py-2 text-white text-sm outline-none cursor-pointer focus:border-gray-500 transition-colors"
                  value={uiColor} 
                  onChange={e => setUiColor(e.target.value)}
                >
                  <option value="Green">Green</option>
                  <option value="Blue">Blue</option>
                  <option value="Purple">Purple</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: CONFIGURACIÓN (Carpetas, Idioma y Sliders) */}
        <div className="bg-[#252527] rounded-xl p-6 border border-[#333] flex flex-col">
          <h2 className="font-semibold mb-6 flex items-center text-sm" style={{ color: activeHex }}>
            <Monitor size={16} className="mr-2" /> Configuración
          </h2>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] text-gray-500 font-bold tracking-wider px-1 mb-2">
              <span>RUTAS</span>
              <span>PANTALLA</span>
            </div>
            
            <button 
              onClick={() => setView('folders')} 
              className="w-full flex items-center justify-between p-3.5 bg-[#1c1c1e] rounded-lg hover:bg-[#2c2c2e] transition border border-[#333]"
            >
              <div className="flex items-center space-x-3 text-sm font-bold text-white">
                <Folder size={18} className="text-gray-400"/> 
                <span>Carpetas locales</span>
              </div>
              <ChevronRight size={18} className="text-gray-500"/>
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-8 px-1 text-sm text-gray-400 border-b border-[#3a3a3c] pb-4">
            <Globe size={16} />
            <select 
              className="bg-transparent border-none outline-none cursor-pointer text-white font-medium"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">Inglés - 🇺🇸</option>
              <option value="es">Español - 🇪🇸</option>
            </select>
          </div>

          <div className="space-y-6 flex-1 pl-1">
            <Slider label="Texto de sugerencias" value={hintSize} onChange={setHintSize} hex={activeHex} />
            <Slider label="Tamaño icono mini" value={miniIconSize} onChange={setMiniIconSize} hex={activeHex} />
            <Slider label="Espaciado visual" value={spacing} onChange={setSpacing} hex={activeHex} />
            <Slider label="Sensibilidad Curveball" value={curveball} onChange={setCurveball} hex={activeHex} />
          </div>

          <button 
            onClick={() => { setHintSize(50); setMiniIconSize(50); setSpacing(50); setCurveball(50); }}
            className="w-full mt-8 flex items-center justify-center space-x-2 py-3 border border-[#3a3a3c] rounded-lg hover:bg-[#333] transition text-sm text-gray-300 font-bold"
          >
            <RefreshCw size={14} /> <span>Restablecer sliders</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE AUXILIAR: SLIDER
// ==========================================
function Slider({ label, value, onChange, hex }: { label: string, value: number, onChange: (v: number) => void, hex: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2 text-gray-300 font-medium">
        <span>{label}</span> 
        <span>{value}%</span>
      </div>
      <input 
        type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#3a3a3c] rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: hex }}
      />
    </div>
  );
}

// ==========================================
// SUB-VISTA: CARPETAS Y ESCANEO
// ==========================================
function FoldersView({ onBack, activeHex }: { onBack: () => void, activeHex: string }) {
  const [addedFolders, setAddedFolders] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Simulación de escaneo al tocar "Scan Now"
  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsScanning(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  // Abre la ventana nativa de macOS
  const handleAddFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Selecciona una carpeta musical"
      });
      if (selectedPath && typeof selectedPath === 'string') {
        if (!addedFolders.includes(selectedPath)) {
          setAddedFolders([...addedFolders, selectedPath]);
        }
      }
    } catch (err) {
      console.error("Cancelado o error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-[#e0e0e0] font-sans flex flex-col">
      <div className="p-10 flex-1 overflow-y-auto">
        <button onClick={onBack} className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors">
          <ChevronLeft size={16} /> <span>Volver a Configuración</span>
        </button>

        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Carpetas de música</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handleScan} 
              disabled={isScanning} 
              className="px-4 py-2 border border-[#3a3a3c] rounded-md text-sm font-medium text-gray-300 hover:bg-[#2c2c2e] transition flex items-center"
            >
              <RefreshCw size={14} className={`mr-2 ${isScanning ? 'animate-spin' : ''}`} style={{ color: activeHex }}/> 
              {isScanning ? 'Scanning...' : 'Scan now'}
            </button>
            <button 
              onClick={handleAddFolder} 
              className="px-4 py-2 bg-[#2c2c2e] border border-[#444] rounded-md text-sm font-bold text-white hover:bg-[#3a3a3c] transition"
            >
              + Add Folder
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-12">We scan these folders for songs and turn them into drag-and-drop recommendations.</p>

        <div className="mb-12">
          <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-wider">Suggested folders</h3>
          <div className="space-y-1">
            <FolderRow path="/Users/jorgequintero/Music/DJ_Sets" isSuggested activeHex={activeHex} />
            <FolderRow path="/Volumes/MUSICA/XVS" isSuggested activeHex={activeHex} />
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-wider">Added folders · {addedFolders.length}</h3>
          <div className="space-y-1">
            {addedFolders.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4">No has añadido ninguna carpeta adicional.</p>
            ) : (
              addedFolders.map((path, idx) => <FolderRow key={idx} path={path} isAdded activeHex={activeHex} />)
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO INFERIOR */}
      <div className="p-8 bg-[#18181a] border-t border-[#2c2c2e]">
        <h4 className="text-[10px] font-bold text-gray-500 tracking-wider mb-2">MAPPING PROGRESS</h4>
        <p className="text-xs text-gray-400 mb-4">Each song must be matched to our catalog before we can recommend it.</p>
        
        <div className="w-full bg-[#2c2c2e] h-1.5 rounded-full overflow-hidden mb-3">
          <div className="h-full transition-all duration-300 ease-out" style={{ width: `${isScanning ? scanProgress : 100}%`, backgroundColor: activeHex }}></div>
        </div>
        
        <div className="flex items-center space-x-6 text-xs font-medium">
          <span className="text-white flex items-center">
            <span className="text-lg mr-1.5 leading-none" style={{ color: activeHex }}>•</span> 
            3.056 mapped
          </span>
          <span className="text-gray-400 flex items-center">
            <span className="text-gray-600 text-sm mr-1.5 leading-none">■</span> 
            53.493 queued
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE AUXILIAR: FILA DE CARPETA
// ==========================================
function FolderRow({ path, isSuggested, isAdded, activeHex }: { path: string, isSuggested?: boolean, isAdded?: boolean, activeHex: string }) {
  return (
    <div className="flex items-center justify-between py-3 group hover:bg-[#2c2c2e] px-4 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#333]">
      <div className="flex items-center space-x-3">
        <div 
          className="w-2.5 h-2.5 rounded-full border-2" 
          style={{ backgroundColor: isAdded ? activeHex : 'transparent', borderColor: activeHex }}
        ></div>
        <span className="text-sm font-medium text-gray-200">{path}</span>
      </div>
      {isSuggested && (
        <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-xs font-bold hover:text-white transition-colors" style={{ color: activeHex }}>Add</button>
          <button className="text-gray-500 text-xs font-medium hover:text-white transition-colors">Ignore</button>
        </div>
      )}
    </div>
  );
}

// Icono auxiliar
const ChevronDown = ({ size, className }: { size: number, className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);