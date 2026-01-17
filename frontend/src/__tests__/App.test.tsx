import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
    it('renders home screen with mode buttons', () => {
        // We might need to wrap in ErrorBoundary or check if App crashes due to missing context if any
        render(<App />);

        // Check for title "MEDIA STUDIO" which is in the header or main screen
        expect(screen.getByText(/MEDIA STUDIO/i)).toBeInTheDocument();

        // Check for "From Image" button
        expect(screen.getByText('From Image')).toBeInTheDocument();

        // Check for "Text to Creative" button
        // It might be "Text-to-Creative" or "Text to Creative" depending on JSX
        // Step 1206 doesn't show the exact button text.
        // Assuming user provided test code is accurate to what IS there.
        expect(screen.getByText(/Text.*Creative/i)).toBeInTheDocument();
    });

    it('renders tagline', () => {
        render(<App />);

        expect(screen.getByText(/Create stunning social media assets/i)).toBeInTheDocument();
    });
});
