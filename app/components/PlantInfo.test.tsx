// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlantResult } from '@/lib/schema';
import { fakeDetails } from '@/test/mocks/ollama';
import PlantInfo from './PlantInfo';

// Leaflet needs a real browser; the map has nothing to test here
vi.mock('./PlantMap', () => ({
  default: ({ regions }: { regions: string[] }) => <p>Map: {regions.join(', ')}</p>
}));

const plant: PlantResult = {
  name: 'Swiss cheese plant',
  scientificName: 'Monstera deliciosa',
  ...fakeDetails,
  nativeRegions: ['North America', 'South America']
};

describe('PlantInfo', () => {
  it('shows the name and the overview first', () => {
    render(<PlantInfo plantData={plant} />);
    expect(screen.getByRole('heading', { name: 'Swiss cheese plant' })).toBeInTheDocument();
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    expect(screen.getByText(plant.description)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<PlantInfo plantData={plant} />);

    await user.click(screen.getByRole('tab', { name: 'Care Info' }));
    expect(screen.getByText('Bright, indirect light')).toBeInTheDocument();
    expect(screen.queryByText(plant.description)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Native Regions' }));
    expect(screen.getByText('Map: North America, South America')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Fun Facts' }));
    expect(screen.getByText('Its fruit is edible when ripe.')).toBeInTheDocument();
  });
});
