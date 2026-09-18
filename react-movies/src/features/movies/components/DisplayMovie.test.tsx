import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';
import apiClient from '../../../api/apiClient';
import AuthenticationContext from '../../security/utils/AuthenticationContext';
import DisplayMovie from './DisplayMovie';

vi.mock('../../../api/apiClient', () => ({
  default: {
    delete: vi.fn()
  }
}));

vi.mock('../../../utils/customConfirm', () => ({
  default: (onConfirm: () => void) => onConfirm()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({})
  }
}));

const deleteMock = vi.mocked(apiClient.delete);
const fireMock = vi.mocked(Swal.fire);
const movie = {
  id: 42,
  title: 'Past Lives (2023)',
  poster: 'https://images.example/past-lives.jpg',
  releaseDate: '2026-09-01T00:00:00Z',
  trailer: ''
};

describe('DisplayMovie', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    fireMock.mockClear();
  });

  it('refreshes the list and confirms a successful deletion', async () => {
    deleteMock.mockResolvedValue({});
    const onDeleted = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthenticationContext.Provider value={{ claims: [{ name: 'isadmin', value: 'true' }], update: vi.fn() }}>
        <MemoryRouter>
          <DisplayMovie movie={movie} onDeleted={onDeleted} />
        </MemoryRouter>
      </AuthenticationContext.Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(`/movies/${movie.id}`));
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(fireMock).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'success',
      title: 'Movie deleted'
    }));
  });
});
