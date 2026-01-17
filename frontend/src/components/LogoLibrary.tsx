import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';

interface Logo {
    id: string;
    name: string;
    preview: string;
    file?: File; // Optional because saved logos loaded from storage/assets might lose File object unless re-fetched
}

interface LogoLibraryProps {
    logos: Logo[];
    selectedLogoId: string | null;
    onSelectLogo: (logoId: string) => void;
    onAddLogo: (file: File, name: string) => void;
    onDeleteLogo: (logoId: string) => void;
}

export function LogoLibrary({
    logos,
    selectedLogoId,
    onSelectLogo,
    onAddLogo,
    onDeleteLogo
}: LogoLibraryProps) {
    const [showUpload, setShowUpload] = useState(false);
    const [logoName, setLogoName] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Prompt for logo name
        const name = logoName || file.name.split('.')[0];
        onAddLogo(file, name);

        setShowUpload(false);
        setLogoName('');
    };

    return (
        <div className="logo-library">
            <label className="section-label">LOGO LIBRARY</label>

            {/* Add New Logo Button */}
            <button
                className="add-logo-btn"
                onClick={() => setShowUpload(!showUpload)}
            >
                <Plus size={16} />
                Add New Logo
            </button>

            {/* Upload Form (conditional) */}
            {showUpload && (
                <div className="upload-form">
                    <input
                        type="text"
                        placeholder="Logo name (e.g., 'Mako')"
                        value={logoName}
                        onChange={(e) => setLogoName(e.target.value)}
                        className="logo-name-input"
                    />
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleFileUpload}
                        className="file-input"
                    />
                </div>
            )}

            {/* Logo Grid */}
            <div className="logo-grid">
                {logos.map(logo => (
                    <div
                        key={logo.id}
                        className={`logo-card ${selectedLogoId === logo.id ? 'selected' : ''}`}
                        onClick={() => onSelectLogo(logo.id)}
                    >
                        <img
                            src={logo.preview}
                            alt={logo.name}
                            className="logo-thumbnail"
                        />
                        <div className="logo-info">
                            <span className="logo-name">{logo.name}</span>
                            {selectedLogoId === logo.id && (
                                <Check size={16} className="check-icon" />
                            )}
                        </div>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLogo(logo.id);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {logos.length === 0 && (
                <p className="empty-state">No logos yet. Add your first logo!</p>
            )}
        </div>
    );
}
