import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EmojisField from '@/app/emojify/_components/EmojisField';
import OutputField from '@/app/emojify/_components/OutputField';

const setSelectedPack = jest.fn();
const setIntensity = jest.fn();
const setEmojisInput = jest.fn();

let contextValue = createContextValue();

jest.mock('lucide-react', () => ({
  Copy: () => <span aria-hidden='true'>copy</span>,
  Shuffle: () => <span aria-hidden='true'>shuffle</span>,
  Sparkles: () => <span aria-hidden='true'>sparkles</span>,
}));

jest.mock('../actions/emojify', () => ({
  emojifyWithAi: jest.fn(),
}));

jest.mock('../app/emojify/_context/store', () => ({
  useEmojifyContext: () => contextValue,
}));

describe('Emojifier controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contextValue = createContextValue();
  });

  test('offers curated packs and intensity controls', () => {
    render(<EmojisField />);

    fireEvent.click(screen.getByRole('button', { name: /Cute/ }));
    fireEvent.click(screen.getByRole('button', { name: /Chaos/ }));

    expect(setSelectedPack).toHaveBeenCalledWith('cute');
    expect(setIntensity).toHaveBeenCalledWith('chaos');
  });

  test('shows the saved custom editor for the custom pack', () => {
    contextValue = createContextValue({
      selectedPack: 'custom',
      emojisInput: '🫡 frog',
    });

    render(<EmojisField />);

    const input = screen.getByLabelText('Custom emojis or words');
    expect(input).toHaveValue('🫡 frog');
    fireEvent.change(input, { target: { value: '🫡 🐸' } });
    expect(setEmojisInput).toHaveBeenCalledWith('🫡 🐸');
  });

  test('shuffle generates a new random result without changing the message', async () => {
    contextValue = createContextValue({
      messageInput: 'hello',
      emojisInput: '😀 😎',
      intensity: 'chaos',
    });
    const random = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99);

    render(<OutputField username='' showAi={false} />);

    await screen.findByText('hello 😀');
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle again' }));
    await waitFor(() =>
      expect(screen.getByText('hello 😎')).toBeInTheDocument()
    );
    random.mockRestore();
  });
});

function createContextValue(overrides: Record<string, unknown> = {}) {
  return { ...baseContextValue(), ...overrides };
}

function baseContextValue() {
  return {
    emojisInput: '😀 😎',
    setEmojisInput,
    selectedPack: 'original' as const,
    setSelectedPack,
    intensity: 'balanced' as const,
    setIntensity,
    messageInput: '',
    setMessageInput: jest.fn(),
    isLoaded: true,
  };
}
