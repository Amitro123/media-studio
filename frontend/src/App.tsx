/**
 * 🎬 Media Studio - Social Media Asset Generator
 * Proper 3-Step Workflow: Upload → Edit → Results
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Wand2,
  Upload,
  Download,
  Loader2,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { DesignerOptions, defaultDesignerOptions } from './components/ImageEditor';
import { LogoLibrary } from './components/LogoLibrary';


// Types
interface Asset {
  platform: string;
  format: string;
  width: number;
  height: number;
  url: string;
  filename?: string;
}

interface Logo {
  id: string;
  name: string; // e.g., "Mako", "Keshet"
  preview: string; // Data URL for preview
  file?: File; // The actual file object for upload
}

interface GenerateResponse {
  status: string;
  assets: Asset[];
  metadata: {
    generated_at: string;
    mode: string;
    prompt: string;
    parsed_prompt: Record<string, any>;
    total_assets: number;
  };
}

type Mode = 'from-image' | 'text-to-creative' | null;
type Step = 'upload' | 'edit' | 'results' | 'history';

// API Base URL
const API_BASE = '';

/**
 * 🎨 ProcessedLogo Component
 * Removes white background from logo image on client-side canvas.
 */
const ProcessedLogo: React.FC<{
  src: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}> = ({ src, className, style, alt }) => {
  const [processedSrc, setProcessedSrc] = useState(src);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const threshold = 230; // White threshold
      for (let i = 0; i < data.length; i += 4) {
        // Check if pixel is near white
        if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
          data[i + 3] = 0; // Set Alpha to 0 (Transparent)
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedSrc(canvas.toDataURL());
    };
  }, [src]);

  return <img src={processedSrc} className={className} style={style} alt={alt} />;
};

// Position button component
const PositionButton: React.FC<{
  position: string;
  currentPosition: string;
  label: string;
  onClick: (pos: string) => void;
}> = ({ position, currentPosition, label, onClick }) => (
  <button
    className={`position-btn ${currentPosition === position ? 'active' : ''}`}
    onClick={() => onClick(position)}
    title={position}
  >
    {label}
  </button>
);

interface HistoryItem {
  id: string;
  timestamp: Date;
  mode: Mode;
  sourceImage: string | null;
  prompt?: string;
  settings: DesignerOptions;
  result: GenerateResponse;
}

function MediaStudioApp() {
  // App State
  const [mode, setMode] = useState<Mode>(null);
  const [step, setStep] = useState<Step>('upload');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('media_studio_history');
      if (saved) {
        return JSON.parse(saved, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        });
      }
    } catch (e) {
      console.error('Failed to parse history', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('media_studio_history', JSON.stringify(history));
  }, [history]);
  const [publishStatus, setPublishStatus] = useState<{ [key: string]: string }>({}); // Publish State

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Designer Options
  const [designerOptions, setDesignerOptions] = useState<DesignerOptions>(defaultDesignerOptions);

  // Logo File Upload
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileObj, setLogoFileObj] = useState<File | null>(null);


  // Logo Library State
  const [logoLibrary, setLogoLibrary] = useState<Logo[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  // Load Logos from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('media_studio_logos');
      if (saved) {
        setLogoLibrary(JSON.parse(saved));
      }
    } catch (e) { console.error('Failed to load logos', e); }
  }, []);

  // Save Logos to LocalStorage
  useEffect(() => {
    // Save only serializable data (exclude File objects)
    const toSave = logoLibrary.map(({ file, ...rest }) => rest);
    localStorage.setItem('media_studio_logos', JSON.stringify(toSave));
  }, [logoLibrary]);

  const handleAddLogo = (file: File, name: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      const newLogo: Logo = {
        id: Date.now().toString(),
        name,
        file,
        preview
      };
      setLogoLibrary(prev => [...prev, newLogo]);
      handleSelectLogo(newLogo.id, newLogo); // Select immediately
    };
    reader.readAsDataURL(file);
  };

  const handleSelectLogo = (logoId: string, logoObj?: Logo) => {
    setSelectedLogoId(logoId);
    const logo = logoObj || logoLibrary.find(l => l.id === logoId);

    if (logo) {
      setLogoPreview(logo.preview);

      // Set file object for upload
      if (logo.file) {
        setLogoFileObj(logo.file);
      } else {
        // Reconstruct File from Data URL if missing (e.g. after reload)
        fetch(logo.preview)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `${logo.name}.png`, { type: 'image/png' });
            setLogoFileObj(file);
          });
      }
    }
  };

  const handleDeleteLogo = (logoId: string) => {
    setLogoLibrary(prev => prev.filter(l => l.id !== logoId));
    if (selectedLogoId === logoId) {
      setSelectedLogoId(null);
      setLogoPreview(null);
      setLogoFileObj(null);
    }
  };

  // Generation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [prompt, setPrompt] = useState('');

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
    // Go to EDIT step when image is uploaded
    setStep('edit');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const openFilePicker = () => fileInputRef.current?.click();

  // Reset to upload
  // Reset state
  const handleReset = () => {
    setResult(null);
    setStep('upload');
    setMode(null);
    setPrompt('');
    setDesignerOptions(defaultDesignerOptions);
    setSelectedFile(null);
    setPreviewUrl(null);
    setLogoPreview(null);
    setLogoFileObj(null);
  };

  // Toggle format selection
  const toggleFormat = (format: string) => {
    const current = designerOptions.selectedFormats;
    const newFormats = current.includes(format)
      ? current.filter(f => f !== format)
      : [...current, format];
    setDesignerOptions({ ...designerOptions, selectedFormats: newFormats });
  };

  // Generate assets
  const handleGenerate = async () => {
    // Validate inputs
    if (mode === 'from-image' && !selectedFile) {
      setError('Please upload an image');
      return;
    }
    if (designerOptions.selectedFormats.length === 0) {
      setError('Please select at least one format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('mode', mode || 'from-image');

      // Handle Image: Uploaded OR Generated
      if (mode === 'text-to-creative' && previewUrl) {
        // Fetch the generated AI image to send to backend
        try {
          const res = await fetch(previewUrl);
          const blob = await res.blob();
          const file = new File([blob], "ai_generated.jpg", { type: "image/jpeg" });
          formData.append('image', file);
        } catch (e) {
          console.error("Failed to fetch generated image", e);
          // Backend handles missing image with placeholder, but we prefer the real one
        }
      } else if (selectedFile) {
        formData.append('image', selectedFile);
      }

      // Append Options
      formData.append('title', designerOptions.title);
      formData.append('cta', designerOptions.cta);
      formData.append('title_font_size', designerOptions.titleFontSize.toString());
      formData.append('cta_font_size', designerOptions.ctaFontSize.toString()); // Added cta_font_size
      formData.append('text_position', designerOptions.textPosition);
      formData.append('text_opacity', designerOptions.textOpacity.toString());
      formData.append('logo_enabled', designerOptions.logoEnabled.toString());
      formData.append('logo_position', designerOptions.logoPosition);
      formData.append('logo_size', designerOptions.logoSize.toString());
      formData.append('formats', designerOptions.selectedFormats.join(','));

      if (logoFileObj && designerOptions.logoEnabled) {
        formData.append('logo_file', logoFileObj);
      }

      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail?.message || errorData.detail || `Error ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
      setResult(data);

      // Save to History
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        mode: mode || 'from-image',
        sourceImage: previewUrl,
        prompt: mode === 'text-to-creative' ? prompt : undefined,
        settings: { ...designerOptions },
        result: data
      };
      setHistory(prev => [historyItem, ...prev]);

      setStep('results');
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Download asset
  const handleDownload = async (asset: Asset) => {
    try {
      const response = await fetch(`${API_BASE}${asset.url}`);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${asset.platform.replace(/\s+/g, '_')}_${asset.format.replace(':', 'x')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  // Download all
  const handleDownloadAll = async () => {
    if (!result?.assets) return;
    for (const asset of result.assets) {
      await handleDownload(asset);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const handlePublish = async (asset: Asset, platform: string) => {
    setPublishStatus(prev => ({ ...prev, [asset.format]: 'publishing' }));

    // Mock API call (2 second delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Success!
    setPublishStatus(prev => ({ ...prev, [asset.format]: 'published' }));

    // Show toast notification
    alert(`✅ Published to ${platform}!`);
  };

  // ============================================
  // STEP 1: HOME (Mode Selection -> Upload/Prompt)
  // ============================================
  if (step === 'upload') {
    return (
      <div className="app-container upload-step">
        <div className="upload-page">
          {/* Header */}
          <div className="upload-header">
            <div className="logo-text">
              <Layers size={32} />
              <span>MEDIA STUDIO</span>
            </div>
            <p className="upload-subtitle">Create stunning social media assets in seconds</p>
            <button
              onClick={() => setStep('history')}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Layers size={16} /> History
            </button>
          </div>

          {/* MODE SELECTION (Home) */}
          {!mode && (
            <div className="mode-selection-grid" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
              <button
                className="mode-card"
                onClick={() => setMode('from-image')}
                style={{
                  background: 'var(--glass-surface)',
                  padding: '30px',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: '200px',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <ImageIcon size={48} className="text-blue-400" />
                <h3 style={{ margin: 0 }}>From Image</h3>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Upload your photo</p>
              </button>

              <button
                className="mode-card"
                onClick={() => setMode('text-to-creative')}
                style={{
                  background: 'var(--glass-surface)',
                  padding: '30px',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: '200px',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Wand2 size={48} className="text-purple-400" />
                <h3 style={{ margin: 0 }}>Text to Creative</h3>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>AI generates the image</p>
              </button>
            </div>
          )}

          {/* UPLOAD SECTION (Only for From Image) */}
          {mode === 'from-image' && (
            <div className="upload-section" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <button
                className="back-btn"
                onClick={() => setMode(null)}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div
                className={`upload-zone-large ${isDragging ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={openFilePicker}
                style={{ width: '100%', maxWidth: '600px' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <Upload size={48} className="upload-icon" />
                <div className="upload-text-large">
                  <strong>Drop your image here</strong>
                  <span>or click to browse</span>
                </div>
                <p className="upload-hint">Supports JPG, PNG, WebP up to 10MB</p>
              </div>
            </div>
          )}

          {/* PROMPT SECTION (Only for Text to Creative) */}
          {mode === 'text-to-creative' && (
            <div className="prompt-section" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '600px', margin: '20px auto' }}>
              <button
                className="back-btn"
                onClick={() => setMode(null)}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ background: 'var(--glass-surface)', padding: '24px', borderRadius: '12px', width: '100%', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Describe your creative</h3>
                <textarea
                  placeholder="E.g., 'Summer sale banner with beach background'"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    resize: 'vertical',
                    marginBottom: '20px'
                  }}
                />
                <button
                  onClick={async () => {
                    setLoading(true);
                    // Mock generation
                    setPreviewUrl('https://via.placeholder.com/1024x1024/000000/FFFFFF?text=Generated+Image');
                    setStep('edit');
                    setLoading(false);
                  }}
                  className="generate-btn-topbar"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={!prompt.trim() || loading}
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="status-message error" style={{ marginTop: '20px' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: EDIT (Designer Mode)
  // ============================================
  if (step === 'edit') {
    return (
      <div className="app-container edit-step">
        {/* Top Bar */}
        <div className="edit-topbar">
          <button className="back-btn" onClick={handleReset}>
            <ArrowLeft size={18} /> New Image
          </button>
          <div className="logo-text small">
            <Layers size={20} />
            <span>MEDIA STUDIO</span>
          </div>
          <button
            className="generate-btn-topbar"
            onClick={handleGenerate}
            disabled={loading || designerOptions.selectedFormats.length === 0}
          >
            {loading ? (
              <><Loader2 size={16} className="loading-spinner" /> Generating...</>
            ) : (
              <>Generate {designerOptions.selectedFormats.length} Assets</>
            )}
          </button>
        </div>

        {/* Edit Grid: Preview/Controls + Chat */}
        <div className="edit-grid">
          {/* LEFT: Preview + Controls */}
          <div className="edit-left-panel">
            {/* Live Preview */}
            <div className="preview-section">
              <h3 className="section-title">Preview</h3>
              <div className="preview-canvas">
                <div className="preview-content-wrapper">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="preview-image-large"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://picsum.photos/1024/1024?random=${Date.now()}`;
                      }}
                    />
                  ) : (
                    <div className="preview-placeholder" style={{
                      color: 'var(--text-muted)',
                      border: '2px dashed var(--glass-border)',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center'
                    }}>
                      {mode === 'text-to-creative' ? 'Enter prompt to generate (Not Implemented)' : 'No image loaded'}
                    </div>
                  )}
                  {/* Logo Overlay Preview */}
                  {designerOptions.logoEnabled && (
                    logoPreview ? (
                      <ProcessedLogo
                        src={logoPreview}
                        className={`preview-logo-overlay-img ${designerOptions.logoPosition}`}
                        style={{ width: `${designerOptions.logoSize * 0.5}px` }} // Scaled for preview
                        alt="Logo"
                      />
                    ) : (
                      /* Default Logo */
                      <ProcessedLogo
                        src="/static/logo/mako_logo.png"
                        className={`preview-logo-overlay-img ${designerOptions.logoPosition}`}
                        style={{ width: `${designerOptions.logoSize * 0.5}px` }}
                        alt="Default Logo"
                      />
                    )
                  )}
                  {/* Text Overlay Preview */}
                  {designerOptions.title && (
                    <div
                      className={`preview-text-overlay ${designerOptions.textPosition}`}
                      style={{ backgroundColor: `rgba(0,0,0,${designerOptions.textOpacity})` }}
                    >
                      <span style={{ fontSize: designerOptions.titleFontSize * 0.25 }}>
                        {designerOptions.title}
                      </span>
                      {designerOptions.cta && (
                        <small style={{ fontSize: designerOptions.ctaFontSize * 0.25 }}>
                          {designerOptions.cta}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>



            {error && (
              <div className="status-message error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
          </div>

          {/* RIGHT: Chat Editor (ALWAYS VISIBLE!) */}
          {/* RIGHT: Design Controls (40%) */}
          <div className="edit-right-panel" style={{ padding: '24px', overflowY: 'auto', background: 'var(--glass-surface)' }}>

            {/* PROMPT RE-EDIT (Text-to-Creative Only) */}
            {mode === 'text-to-creative' && (
              <div className="control-group prompt-controls" style={{ marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Wand2 size={16} /> AI PROMPT
                </h4>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your creative..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    resize: 'vertical',
                    marginBottom: '12px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={async () => {
                    setLoading(true);
                    // Use Pollinations.ai for free real AI generation demo
                    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.random()}`;

                    // Pre-load image to avoid flicker
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                      setPreviewUrl(url);
                      setLoading(false);
                    };
                    img.onerror = () => {
                      // Fallback
                      setPreviewUrl(`https://picsum.photos/1024/1024?random=${Date.now()}`);
                      setLoading(false);
                    };
                  }}
                  className="upload-logo-btn"
                  style={{ justifyContent: 'center', color: 'white', borderColor: '#c084fc' }}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><RefreshCw size={16} /> Regenerate Image</>}
                </button>
              </div>
            )}

            <h3 className="section-title">Design Controls</h3>

            {/* Text Controls */}
            <div className="control-group">
              <div className="control-group-header">
                <label>Title & CTA</label>
              </div>
              <input
                type="text"
                placeholder="Main Headline"
                value={designerOptions.title}
                onChange={(e) => setDesignerOptions({ ...designerOptions, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Call to Action (Optional)"
                value={designerOptions.cta}
                onChange={(e) => setDesignerOptions({ ...designerOptions, cta: e.target.value })}
                style={{ marginTop: '8px' }}
              />

              {/* Text Position */}
              <label style={{ marginTop: '16px', display: 'block', marginBottom: '8px' }}>Text Position</label>
              <div className="text-position-buttons">
                {['top', 'center', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    className={designerOptions.textPosition === pos ? 'active' : ''}
                    onClick={() => setDesignerOptions({ ...designerOptions, textPosition: pos as any })}
                  >
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Formatting Controls */}
            <div className="control-group">
              <div className="control-group-header">
                <label>Font Size: {designerOptions.titleFontSize}px</label>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={designerOptions.titleFontSize}
                onChange={(e) => setDesignerOptions({ ...designerOptions, titleFontSize: parseInt(e.target.value) })}
              />
            </div>

            {/* Logo Controls */}
            <div className="control-group">
              <div className="control-group-header">
                <label>Logo Settings</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={designerOptions.logoEnabled}
                    onChange={(e) => setDesignerOptions({ ...designerOptions, logoEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {designerOptions.logoEnabled && (
                <>
                  <LogoLibrary
                    logos={logoLibrary}
                    selectedLogoId={selectedLogoId}
                    onSelectLogo={(id) => handleSelectLogo(id)}
                    onAddLogo={handleAddLogo}
                    onDeleteLogo={handleDeleteLogo}
                  />

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                    <div className="position-grid">
                      <PositionButton position="top-left" currentPosition={designerOptions.logoPosition} label="↖" onClick={(pos) => setDesignerOptions({ ...designerOptions, logoPosition: pos as any })} />
                      <PositionButton position="top-right" currentPosition={designerOptions.logoPosition} label="↗" onClick={(pos) => setDesignerOptions({ ...designerOptions, logoPosition: pos as any })} />
                      <PositionButton position="bottom-left" currentPosition={designerOptions.logoPosition} label="↙" onClick={(pos) => setDesignerOptions({ ...designerOptions, logoPosition: pos as any })} />
                      <PositionButton position="bottom-right" currentPosition={designerOptions.logoPosition} label="↘" onClick={(pos) => setDesignerOptions({ ...designerOptions, logoPosition: pos as any })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Size: {designerOptions.logoSize}</label>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        value={designerOptions.logoSize}
                        onChange={(e) => setDesignerOptions({ ...designerOptions, logoSize: parseInt(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Format Selection */}
            <div className="control-group">
              <label>Output Formats</label>
              <div className="format-grid">
                {[
                  { key: '16:9', label: 'Feed' },
                  { key: '1:1', label: 'Square' },
                  { key: '9:16', label: 'Story' },
                  { key: '4:5', label: 'Portrait' },
                ].map((fmt) => (
                  <label key={fmt.key} className="format-checkbox">
                    <input
                      type="checkbox"
                      checked={designerOptions.selectedFormats.includes(fmt.key)}
                      onChange={() => toggleFormat(fmt.key)}
                    />
                    <span>{fmt.key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button in Controls Panel */}
            <button
              className="generate-btn-panel"
              onClick={handleGenerate}
              disabled={loading || designerOptions.selectedFormats.length === 0}
              style={{ marginTop: '20px' }}
            >
              {loading ? (
                <><Loader2 size={18} className="loading-spinner" /> Generating...</>
              ) : (
                <>🎨 GENERATE {designerOptions.selectedFormats.length} ASSETS</>
              )}
            </button>

          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 3: RESULTS
  // ============================================
  if (step === 'results' && result) {
    return (
      <div className="results-screen">
        <div className="results-header">
          <button onClick={() => setStep('edit')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} /> Back to Editor
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>🎉 Generated Assets</h2>
            <p style={{ color: 'var(--text-muted)' }}>{mode} • {result.assets.length} formats</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep('history')}
              className="download-all-btn" // Reusing style for consistency, maybe change color
              style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)' }}
            >
              <Layers size={18} /> History
            </button>
            <button className="download-all-btn" onClick={handleDownloadAll}>
              <Download size={18} /> Download All
            </button>
          </div>
        </div>

        <div className="results-grid">
          {result.assets.map(asset => {
            const status = publishStatus[asset.format];
            const platformMap: Record<string, string> = {
              "16:9": "Facebook",
              "1:1": "Instagram",
              "9:16": "Instagram Stories",
              "4:5": "Facebook/Instagram"
            };

            return (
              <div key={asset.format} className="result-card">
                <img
                  src={asset.url}
                  alt={asset.platform}
                />

                <div className="card-info">
                  <h4>{asset.platform}</h4>
                  <p className="dimensions">
                    {asset.format} -  {asset.width} × {asset.height}px
                  </p>
                </div>

                <div className="card-actions">
                  <button
                    className="download-btn"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = asset.url;
                      link.download = asset.filename || `media_studio_${asset.format}.jpg`;
                      link.click();
                    }}
                  >
                    <Download size={16} /> Download
                  </button>

                  <button
                    className={`publish-btn ${status === 'published' ? 'published' : ''}`}
                    onClick={() => handlePublish(asset, platformMap[asset.format] || 'Social Media')}
                    disabled={status === 'publishing' || status === 'published'}
                  >
                    {status === 'publishing' ? '⏳ Publishing...' :
                      status === 'published' ? '✅ Published' :
                        `📤 Publish to ${platformMap[asset.format] || 'Social Media'}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 4: HISTORY
  // ============================================
  if (step === 'history') {
    return (
      <div className="app-container" style={{ padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Generation History</h1>
            <button
              onClick={() => setStep('upload')}
              className="back-btn"
              style={{ background: 'var(--glass-surface)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--glass-surface)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No history yet. Create some assets!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {history.map(item => (
                <div key={item.id} style={{ background: 'var(--glass-surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '200px', background: '#000', position: 'relative' }}>
                    {item.sourceImage ? (
                      <img src={item.sourceImage} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Preview</div>
                    )}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'white' }}>
                      {item.mode === 'from-image' ? 'From Image' : 'Text to Creative'}
                    </div>
                  </div>
                  <div style={{ padding: '16px', flex: 1 }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {item.timestamp.toLocaleString()}
                    </p>
                    {item.prompt && (
                      <p style={{ margin: '0 0 12px 0', fontStyle: 'italic', fontSize: '0.9rem', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{item.prompt}"
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.9rem' }}>{item.result.assets.length} Assets</span>
                      <button
                        onClick={() => {
                          // Restore
                          if (item.sourceImage) setPreviewUrl(item.sourceImage);
                          setMode(item.mode);
                          setDesignerOptions(item.settings);
                          setResult(item.result);
                          setStep('results');
                        }}
                        style={{ background: 'rgba(0, 243, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <MediaStudioApp />
    </ErrorBoundary>
  );
}

export default App;
