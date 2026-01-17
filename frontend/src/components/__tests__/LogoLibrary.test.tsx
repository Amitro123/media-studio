import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogoLibrary } from '../LogoLibrary';

describe('LogoLibrary', () => {
    const mockLogos = [
        { id: '1', name: 'Mako', preview: '/mako.png' },
        { id: '2', name: 'Keshet', preview: '/keshet.png' },
    ];

    it('renders logo library with logos', () => {
        render(
            <LogoLibrary
                logos={mockLogos}
                selectedLogoId="1"
                onSelectLogo={vi.fn()}
                onAddLogo={vi.fn()}
                onDeleteLogo={vi.fn()}
            />
        );

        expect(screen.getByText('Mako')).toBeInTheDocument();
        expect(screen.getByText('Keshet')).toBeInTheDocument();
    });

    it('calls onSelectLogo when logo is clicked', () => {
        const onSelectLogo = vi.fn();

        render(
            <LogoLibrary
                logos={mockLogos}
                selectedLogoId={null}
                onSelectLogo={onSelectLogo}
                onAddLogo={vi.fn()}
                onDeleteLogo={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Mako'));
        expect(onSelectLogo).toHaveBeenCalledWith('1');
    });

    it('shows empty state when no logos', () => {
        render(
            <LogoLibrary
                logos={[]}
                selectedLogoId={null}
                onSelectLogo={vi.fn()}
                onAddLogo={vi.fn()}
                onDeleteLogo={vi.fn()}
            />
        );

        expect(screen.getByText(/No logos yet/i)).toBeInTheDocument();
    });
});
