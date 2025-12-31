import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../AuthModal';

describe('AuthModal', () => {
  it('renders two tabs for GitHub and Wallet', () => {
    render(
      <AuthModal
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
  });

  it('triggers callback on GitHub sign-in button click', async () => {
    const mockSuccess = jest.fn();
    const mockOpenChange = jest.fn();

    render(
      <AuthModal
        open={true}
        onOpenChange={mockOpenChange}
        onSuccess={mockSuccess}
      />
    );

    const githubButton = screen.getByRole('button', { name: /sign in with github/i });
    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 2000 });
  });

  it('displays correct content for GitHub tab', () => {
    render(
      <AuthModal
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(screen.getByText(/Connect your GitHub account to track your contributions/i)).toBeInTheDocument();
  });

  it('displays correct content for Wallet tab', () => {
    render(
      <AuthModal
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />
    );

    const walletTab = screen.getByRole('tab', { name: /wallet/i });
    fireEvent.click(walletTab);

    expect(screen.getByText(/Connect your wallet to mint and trade developer tokens/i)).toBeInTheDocument();
  });
});
