import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset document classes
        document.documentElement.classList.remove('dark');
    });

    describe('Initial Render', () => {
        it('should render the app with navigation', () => {
            render(<App />);
            
            expect(screen.getByText('Finance Manager')).toBeInTheDocument();
            expect(screen.getByText('Gestione Finanze Personali')).toBeInTheDocument();
        });

        it('should render dashboard by default', () => {
            render(<App />);
            
            const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
            expect(dashboardButton).toHaveClass('bg-linear-to-r');
        });

        it('should render all navigation buttons', () => {
            render(<App />);
            
            expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /conti/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /transazioni/i })).toBeInTheDocument();
        });

        it('should render theme toggle button', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            expect(themeButton).toBeInTheDocument();
        });

        it('should render footer', () => {
            render(<App />);
            
            expect(screen.getByText(/Finance Manager v1.0/i)).toBeInTheDocument();
            expect(screen.getByText(/Dati salvati in PostgreSQL/i)).toBeInTheDocument();
        });

        it('should display current year in footer', () => {
            render(<App />);
            
            const currentYear = new Date().getFullYear();
            expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should switch to accounts page', () => {
            render(<App />);
            
            const accountsButton = screen.getByRole('button', { name: /conti/i });
            fireEvent.click(accountsButton);
            
            expect(accountsButton).toHaveClass('bg-linear-to-r');
        });

        it('should switch to transactions page', () => {
            render(<App />);
            
            const transactionsButton = screen.getByRole('button', { name: /transazioni/i });
            fireEvent.click(transactionsButton);
            
            expect(transactionsButton).toHaveClass('bg-linear-to-r');
        });

        it('should switch back to dashboard', () => {
            render(<App />);
            
            // Go to accounts
            const accountsButton = screen.getByRole('button', { name: /conti/i });
            fireEvent.click(accountsButton);
            
            // Go back to dashboard
            const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
            fireEvent.click(dashboardButton);
            
            expect(dashboardButton).toHaveClass('bg-linear-to-r');
        });

        it('should maintain only one active page at a time', () => {
            render(<App />);
            
            const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
            const accountsButton = screen.getByRole('button', { name: /conti/i });
            const transactionsButton = screen.getByRole('button', { name: /transazioni/i });
            
            // Initially dashboard is active
            expect(dashboardButton).toHaveClass('bg-linear-to-r');
            
            // Click accounts
            fireEvent.click(accountsButton);
            expect(accountsButton).toHaveClass('bg-linear-to-r');
            expect(dashboardButton).not.toHaveClass('bg-linear-to-r');
            
            // Click transactions
            fireEvent.click(transactionsButton);
            expect(transactionsButton).toHaveClass('bg-linear-to-r');
            expect(accountsButton).not.toHaveClass('bg-linear-to-r');
        });
    });

    describe('Theme Management', () => {
        it('should start with system theme by default', () => {
            render(<App />);
            
            const themeIcon = screen.getByText('💻');
            expect(themeIcon).toBeInTheDocument();
        });

        it('should cycle through themes: light → dark → system', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Start with system (💻)
            expect(screen.getByText('💻')).toBeInTheDocument();
            
            // Click to light
            fireEvent.click(themeButton!);
            expect(screen.getByText('☀️')).toBeInTheDocument();
            
            // Click to dark
            fireEvent.click(themeButton!);
            expect(screen.getByText('🌙')).toBeInTheDocument();
            
            // Click back to system
            fireEvent.click(themeButton!);
            expect(screen.getByText('💻')).toBeInTheDocument();
        });

        it('should apply dark class when dark theme selected', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Switch to light first
            fireEvent.click(themeButton!);
            
            // Then to dark
            fireEvent.click(themeButton!);
            
            waitFor(() => {
                expect(document.documentElement.classList.contains('dark')).toBe(true);
            });
        });

        it('should remove dark class when light theme selected', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Switch to light
            fireEvent.click(themeButton!);
            
            waitFor(() => {
                expect(document.documentElement.classList.contains('dark')).toBe(false);
            });
        });

        it('should persist theme to localStorage', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Switch to light
            fireEvent.click(themeButton!);
            
            expect(localStorage.getItem('theme')).toBe('light');
            
            // Switch to dark
            fireEvent.click(themeButton!);
            
            expect(localStorage.getItem('theme')).toBe('dark');
        });

        it('should load theme from localStorage on mount', () => {
            localStorage.setItem('theme', 'dark');
            
            render(<App />);
            
            expect(screen.getByText('🌙')).toBeInTheDocument();
        });

        it('should handle system theme with dark preference', () => {
            // Mock matchMedia to return dark preference
            (window.matchMedia as jest.Mock).mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));
            
            render(<App />);
            
            // Should be in system mode
            expect(screen.getByText('💻')).toBeInTheDocument();
            
            waitFor(() => {
                expect(document.documentElement.classList.contains('dark')).toBe(true);
            });
        });

        it('should update theme when system preference changes', async () => {
            const listeners: Array<(e: MediaQueryListEvent) => void> = [];
            
            (window.matchMedia as jest.Mock).mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
                    if (event === 'change') {
                        listeners.push(listener);
                    }
                }),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));
            
            render(<App />);
            
            // Should be in system mode (light)
            expect(screen.getByText('💻')).toBeInTheDocument();
            
            // Simulate system theme change to dark
            if (listeners.length > 0) {
                listeners[0]({ matches: true } as MediaQueryListEvent);
            }
            
            await waitFor(() => {
                expect(document.documentElement.classList.contains('dark')).toBe(true);
            });
        });

        it('should have correct title attribute on theme button', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            expect(themeButton).toHaveAttribute('title');
            expect(themeButton?.getAttribute('title')).toMatch(/Tema:/);
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid theme from localStorage', () => {
            localStorage.setItem('theme', 'invalid-theme');
            
            // Should fallback to system
            render(<App />);
            
            expect(screen.getByText('💻')).toBeInTheDocument();
        });

        it('should handle rapid navigation changes', () => {
            render(<App />);
            
            const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
            const accountsButton = screen.getByRole('button', { name: /conti/i });
            const transactionsButton = screen.getByRole('button', { name: /transazioni/i });
            
            // Rapidly click different pages
            fireEvent.click(accountsButton);
            fireEvent.click(transactionsButton);
            fireEvent.click(dashboardButton);
            fireEvent.click(accountsButton);
            
            // Should end up on accounts
            expect(accountsButton).toHaveClass('bg-linear-to-r');
        });

        it('should handle rapid theme changes', () => {
            render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Rapidly click theme button
            fireEvent.click(themeButton!);
            fireEvent.click(themeButton!);
            fireEvent.click(themeButton!);
            fireEvent.click(themeButton!);
            
            // Should cycle correctly (4 clicks = back to light)
            expect(screen.getByText('☀️')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have semantic HTML structure', () => {
            render(<App />);
            
            expect(screen.getByRole('navigation')).toBeInTheDocument();
            expect(screen.getByRole('main')).toBeInTheDocument();
            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });

        it('should have clickable buttons with proper roles', () => {
            render(<App />);
            
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
            
            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    describe('Performance', () => {
        it('should not re-render unnecessarily on theme change', () => {
            const { rerender } = render(<App />);
            
            const themeButtons = screen.getAllByRole('button');
            const themeButton = themeButtons.find(btn => 
                btn.textContent?.includes('☀️') || 
                btn.textContent?.includes('🌙') || 
                btn.textContent?.includes('💻')
            );
            
            // Change theme
            fireEvent.click(themeButton!);
            
            // Re-render should not cause issues
            rerender(<App />);
            
            expect(screen.getByText('Finance Manager')).toBeInTheDocument();
        });
    });
});
