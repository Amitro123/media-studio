/**
 * 🎨 Image Editor Component - Designer Mode Controls
 * Provides sliders and controls for customizing generated assets
 */

import React from 'react';
import {
    Type,
    Image as ImageIcon,
    Settings,
} from 'lucide-react';

// Position button component
interface PositionButtonProps {
    position: string;
    currentPosition: string;
    label: string;
    onClick: (pos: string) => void;
}

const PositionButton: React.FC<PositionButtonProps> = ({
    position,
    currentPosition,
    label,
    onClick,
}) => (
    <button
        className={`position-btn ${currentPosition === position ? 'active' : ''}`}
        onClick={() => onClick(position)}
        title={position}
    >
        {label}
    </button>
);

// Format checkbox component
interface FormatCheckboxProps {
    format: string;
    label: string;
    checked: boolean;
    onChange: (format: string, checked: boolean) => void;
}

const FormatCheckbox: React.FC<FormatCheckboxProps> = ({
    format,
    label,
    checked,
    onChange,
}) => (
    <label className="format-checkbox">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(format, e.target.checked)}
        />
        <span>{label}</span>
    </label>
);

// Main export
export interface DesignerOptions {
    // Text options
    title: string;
    cta: string;
    titleFontSize: number;
    ctaFontSize: number;
    textPosition: 'center' | 'top' | 'bottom';
    textOpacity: number;

    // Logo options
    logoEnabled: boolean;
    logoPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    logoSize: number;

    // Format selection
    selectedFormats: string[];
}

interface ImageEditorProps {
    uploadedImage: string | null;
    options: DesignerOptions;
    onOptionsChange: (options: DesignerOptions) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
    uploadedImage,
    options,
    onOptionsChange,
    onGenerate,
    isGenerating,
}) => {
    // Designer controls are always visible

    // Update a single option
    const updateOption = <K extends keyof DesignerOptions>(
        key: K,
        value: DesignerOptions[K]
    ) => {
        onOptionsChange({ ...options, [key]: value });
    };

    // Toggle format selection
    const toggleFormat = (format: string, checked: boolean) => {
        const newFormats = checked
            ? [...options.selectedFormats, format]
            : options.selectedFormats.filter((f) => f !== format);
        updateOption('selectedFormats', newFormats);
    };

    // Available formats
    const FORMATS = [
        { key: '16:9', label: 'Facebook Feed', dims: '1200×675' },
        { key: '1:1', label: 'Instagram Square', dims: '1080×1080' },
        { key: '9:16', label: 'Instagram Story', dims: '1080×1920' },
        { key: '4:5', label: 'Portrait', dims: '1080×1350' },
    ];

    return (
        <div className="image-editor">
            {/* Preview Section */}
            {uploadedImage && (
                <div className="editor-preview">
                    <div className="preview-container">
                        <img src={uploadedImage} alt="Preview" className="preview-base-image" />

                        {/* Logo overlay preview */}
                        {options.logoEnabled && (
                            <div className={`preview-logo ${options.logoPosition}`}>
                                <div
                                    className="logo-placeholder"
                                    style={{ width: options.logoSize * 0.3, height: options.logoSize * 0.15 }}
                                >
                                    LOGO
                                </div>
                            </div>
                        )}

                        {/* Text overlay preview */}
                        {options.title && (
                            <div
                                className={`preview-text-box ${options.textPosition}`}
                                style={{
                                    backgroundColor: `rgba(0, 0, 0, ${options.textOpacity})`,
                                }}
                            >
                                <div
                                    className="preview-title"
                                    style={{ fontSize: options.titleFontSize * 0.3 }}
                                >
                                    {options.title}
                                </div>
                                {options.cta && (
                                    <div
                                        className="preview-cta"
                                        style={{ fontSize: options.ctaFontSize * 0.3 }}
                                    >
                                        {options.cta}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className="editor-controls">
                {/* Text Controls */}
                <div className="control-section">
                    <div className="section-header">
                        <Type size={16} />
                        <span>Text Overlay</span>
                    </div>

                    <div className="control-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={options.title}
                            onChange={(e) => updateOption('title', e.target.value)}
                            placeholder="Enter title text..."
                        />
                    </div>

                    <div className="control-group">
                        <label>Call-to-Action</label>
                        <input
                            type="text"
                            value={options.cta}
                            onChange={(e) => updateOption('cta', e.target.value)}
                            placeholder="Click here for details"
                        />
                    </div>

                    <div className="control-group">
                        <label>Text Position</label>
                        <div className="position-grid-vertical">
                            <PositionButton
                                position="top"
                                currentPosition={options.textPosition}
                                label="Top"
                                onClick={(p) => updateOption('textPosition', p as 'top' | 'center' | 'bottom')}
                            />
                            <PositionButton
                                position="center"
                                currentPosition={options.textPosition}
                                label="Center"
                                onClick={(p) => updateOption('textPosition', p as 'top' | 'center' | 'bottom')}
                            />
                            <PositionButton
                                position="bottom"
                                currentPosition={options.textPosition}
                                label="Bottom"
                                onClick={(p) => updateOption('textPosition', p as 'top' | 'center' | 'bottom')}
                            />
                        </div>
                    </div>

                    <div className="control-group">
                        <label>Font Size: {options.titleFontSize}px</label>
                        <input
                            type="range"
                            min={60}
                            max={120}
                            value={options.titleFontSize}
                            onChange={(e) => updateOption('titleFontSize', parseInt(e.target.value))}
                            className="slider"
                        />
                    </div>

                    <div className="control-group">
                        <label>Background Opacity: {Math.round(options.textOpacity * 100)}%</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={options.textOpacity * 100}
                            onChange={(e) => updateOption('textOpacity', parseInt(e.target.value) / 100)}
                            className="slider"
                        />
                    </div>
                </div>

                {/* Logo Controls */}
                <div className="control-section">
                    <div className="section-header">
                        <ImageIcon size={16} />
                        <span>Logo</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={options.logoEnabled}
                                onChange={(e) => updateOption('logoEnabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {options.logoEnabled && (
                        <>
                            <div className="control-group">
                                <label>Position</label>
                                <div className="position-grid">
                                    <PositionButton
                                        position="top-left"
                                        currentPosition={options.logoPosition}
                                        label="↖"
                                        onClick={(p) => updateOption('logoPosition', p as DesignerOptions['logoPosition'])}
                                    />
                                    <PositionButton
                                        position="top-right"
                                        currentPosition={options.logoPosition}
                                        label="↗"
                                        onClick={(p) => updateOption('logoPosition', p as DesignerOptions['logoPosition'])}
                                    />
                                    <PositionButton
                                        position="bottom-left"
                                        currentPosition={options.logoPosition}
                                        label="↙"
                                        onClick={(p) => updateOption('logoPosition', p as DesignerOptions['logoPosition'])}
                                    />
                                    <PositionButton
                                        position="bottom-right"
                                        currentPosition={options.logoPosition}
                                        label="↘"
                                        onClick={(p) => updateOption('logoPosition', p as DesignerOptions['logoPosition'])}
                                    />
                                </div>
                            </div>

                            <div className="control-group">
                                <label>Size: {options.logoSize}px</label>
                                <input
                                    type="range"
                                    min={80}
                                    max={300}
                                    value={options.logoSize}
                                    onChange={(e) => updateOption('logoSize', parseInt(e.target.value))}
                                    className="slider"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Format Selection */}
                <div className="control-section">
                    <div className="section-header">
                        <Settings size={16} />
                        <span>Output Formats</span>
                    </div>

                    <div className="format-grid">
                        {FORMATS.map((fmt) => (
                            <FormatCheckbox
                                key={fmt.key}
                                format={fmt.key}
                                label={`${fmt.key} ${fmt.label}`}
                                checked={options.selectedFormats.includes(fmt.key)}
                                onChange={toggleFormat}
                            />
                        ))}
                    </div>

                    <div className="format-count">
                        {options.selectedFormats.length} format(s) selected
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    className="generate-btn"
                    onClick={onGenerate}
                    disabled={isGenerating || options.selectedFormats.length === 0}
                >
                    {isGenerating ? (
                        'Generating...'
                    ) : (
                        `Generate ${options.selectedFormats.length} Asset${options.selectedFormats.length !== 1 ? 's' : ''}`
                    )}
                </button>
            </div>
        </div>
    );
};

// Default options - English
export const defaultDesignerOptions: DesignerOptions = {
    title: 'End of Season Sale 50%',
    cta: 'Learn More',
    titleFontSize: 90,
    ctaFontSize: 50,
    textPosition: 'center',
    textOpacity: 0.6,
    logoEnabled: true,
    logoPosition: 'top-right',
    logoSize: 150,
    selectedFormats: ['16:9', '1:1', '9:16', '4:5'],
};

export default ImageEditor;
