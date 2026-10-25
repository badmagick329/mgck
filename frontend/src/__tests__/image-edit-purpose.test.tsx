import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { autoCropperMetadata } from '@/app/image-edit/metadata';
import ImageEditPage from '@/app/image-edit/page';

// Footer's feedback form opens a Redis connection that keeps Jest alive.
jest.mock('../app/_components/Footer', () => () => null);
jest.mock('../app/_components/Navbar', () => () => null);

describe('AutoCropper purpose', () => {
  test('search metadata describes border removal, not subject cropping', () => {
    const { title, description } = autoCropperMetadata;
    expect(title).toBe(
      'AutoCropper: Remove Solid or Gradient Borders from Images'
    );
    expect(description).toMatch(/solid color or gradient border/);
    expect(`${title} ${description}`).not.toMatch(/smart|background eraser/i);
    expect(autoCropperMetadata).not.toHaveProperty('keywords');
    expect(autoCropperMetadata.alternates).toEqual({
      canonical: '/image-edit',
    });
  });

  test('shows a before and after example until images are added', () => {
    render(<ImageEditPage />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Remove the solid color or gradient border around an image',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /lakeside photo/ })).toHaveLength(
      2
    );
  });
});
