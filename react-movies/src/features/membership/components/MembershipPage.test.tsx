import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/apiClient';
import AuthenticationContext from '../../security/utils/AuthenticationContext';
import MembershipPage from './MembershipPage';

vi.mock('../../../api/apiClient', () => ({
  default: { get: vi.fn() }
}));

const getMock = vi.mocked(apiClient.get);

describe('MembershipPage', () => {
  beforeEach(() => getMock.mockReset());

  it('explains how a visitor can join without calling the private endpoint', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email membership team' })).toHaveAttribute(
      'href', expect.stringContaining('mailto:membership@framecinemas.nz')
    );
    expect(getMock).not.toHaveBeenCalled();
  });

  it('shows the member number returned for the signed-in user', async () => {
    getMock.mockResolvedValue({
      data: {
        membershipNumber: 'FC-A1B2C3',
        status: 'Active',
        joinedAt: '2026-09-19T00:00:00Z'
      }
    });

    render(
      <MemoryRouter>
        <AuthenticationContext.Provider value={{ claims: [{ name: 'email', value: 'member@example.com' }], update: vi.fn() }}>
          <MembershipPage />
        </AuthenticationContext.Provider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'FC-A1B2C3' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledWith('/memberships/mine');
  });
});
