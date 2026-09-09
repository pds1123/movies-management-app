import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/apiClient';
import LandingPage from './LandingPage';

vi.mock('../../../api/apiClient', () => ({
  default: {
    get: vi.fn()
  }
}));

const getMock = vi.mocked(apiClient.get);
const film = {
  id: 1,
  title: 'Past Lives (2023)',
  poster: 'https://images.example/past-lives.jpg',
  releaseDate: '2026-09-01T00:00:00',
  trailer: ''
};

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('shows loading placeholders while the programme is loading', () => {
    getMock.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getAllByRole('status', { name: 'Loading films' })).toHaveLength(2);
  });

  it('shows films returned by the programme endpoint', async () => {
    getMock.mockResolvedValue({
      data: { inTheaters: [film], upcomingReleases: [] }
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: film.title })).toBeInTheDocument();
    expect(screen.getByText('No films are available yet.')).toBeInTheDocument();
  });

  it('shows an error and lets the visitor retry', async () => {
    getMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: { inTheaters: [film], upcomingReleases: [] } });

    renderPage();

    const retry = await screen.findByRole('button', { name: 'Retry programme' });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(retry);

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: film.title })).toBeInTheDocument();
  });
});
