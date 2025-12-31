import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EcosystemCard } from '../EcosystemCard';

describe('EcosystemCard', () => {
  const mockEcosystem = {
    id: 'eco-1',
    name: 'Test Ecosystem',
    score: 1000,
  };

  const mockProjects = [
    { id: 'proj-1', name: 'Project 1', prs: 10 },
    { id: 'proj-2', name: 'Project 2', prs: 20 },
  ];

  const mockContributions = [
    { description: 'Fixed bug', url: 'https://github.com/test/pr/1' },
    { description: 'Added feature', url: 'https://github.com/test/pr/2' },
  ];

  it('displays ecosystem name and coins earned', () => {
    render(
      <EcosystemCard
        ecosystem={mockEcosystem}
        projects={mockProjects}
        contributions={mockContributions}
      />
    );

    expect(screen.getByText('Test Ecosystem')).toBeInTheDocument();
    expect(screen.getByText('1000 coins earned')).toBeInTheDocument();
  });

  it('displays dropdown with project options', () => {
    render(
      <EcosystemCard
        ecosystem={mockEcosystem}
        projects={mockProjects}
        contributions={mockContributions}
      />
    );

    const dropdownButton = screen.getByRole('button', { name: /select project/i });
    fireEvent.click(dropdownButton);

    expect(screen.getByText('Project 1 (10 PRs)')).toBeInTheDocument();
    expect(screen.getByText('Project 2 (20 PRs)')).toBeInTheDocument();
  });

  it('calls onProjectSelect when a project is selected', () => {
    const mockProjectSelect = jest.fn();

    render(
      <EcosystemCard
        ecosystem={mockEcosystem}
        projects={mockProjects}
        contributions={mockContributions}
        onProjectSelect={mockProjectSelect}
      />
    );

    const dropdownButton = screen.getByRole('button', { name: /select project/i });
    fireEvent.click(dropdownButton);

    const projectOption = screen.getByText('Project 1 (10 PRs)');
    fireEvent.click(projectOption);

    expect(mockProjectSelect).toHaveBeenCalledWith('proj-1');
  });

  it('displays contributions', () => {
    render(
      <EcosystemCard
        ecosystem={mockEcosystem}
        projects={mockProjects}
        contributions={mockContributions}
      />
    );

    expect(screen.getByText('Fixed bug')).toBeInTheDocument();
    expect(screen.getByText('Added feature')).toBeInTheDocument();
  });
});
