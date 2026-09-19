import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { cinemaDetails } from '../../../config/cinemaDetails';
import AboutPage from './AboutPage';

describe('AboutPage', () => {
  it('shows the cinema address and links to membership', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    expect(screen.getByText(cinemaDetails.address)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ask about membership' })).toHaveAttribute('href', '/membership');
  });
});
