import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssueRow } from '../IssueRow';

describe('IssueRow', () => {
  const mockIssue = {
    id: 'issue-1',
    title: 'Test Issue',
    description: 'This is a test issue description',
    stakeAmountRequired: 1000,
    stakedBy: [
      { address: '0x123', amount: 300 },
      { address: '0x456', amount: 200 },
    ],
  };

  it('displays issue title and description', () => {
    render(<IssueRow issue={mockIssue} onStake={() => {}} />);

    expect(screen.getByText('Test Issue')).toBeInTheDocument();
    expect(screen.getByText('This is a test issue description')).toBeInTheDocument();
  });

  it('displays stake progress correctly', () => {
    render(<IssueRow issue={mockIssue} onStake={() => {}} />);

    expect(screen.getByText('500 / 1000 staked')).toBeInTheDocument();
  });

  it('calls onStake when Stake button is clicked', () => {
    const mockOnStake = jest.fn();
    render(<IssueRow issue={mockIssue} onStake={mockOnStake} />);

    const stakeButton = screen.getByRole('button', { name: /stake/i });
    fireEvent.click(stakeButton);

    expect(mockOnStake).toHaveBeenCalled();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<IssueRow issue={mockIssue} onStake={() => {}} />);
    
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('handles issues with no stakes', () => {
    const issueWithNoStakes = {
      ...mockIssue,
      stakedBy: [],
    };

    render(<IssueRow issue={issueWithNoStakes} onStake={() => {}} />);

    expect(screen.getByText('0 / 1000 staked')).toBeInTheDocument();
  });
});
