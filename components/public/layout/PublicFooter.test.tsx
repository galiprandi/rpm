import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicFooter } from './PublicFooter';
import React from 'react';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';

// Mock next/link to render a simple anchor tag for easier testing
vi.mock('next/link', () => {
  return {
    default: ({ children, href, className, 'aria-label': ariaLabel, ...props }: any) => {
      return (
        <a href={href} className={className} aria-label={ariaLabel} {...props}>
          {children}
        </a>
      );
    },
  };
});

describe('PublicFooter', () => {
  it('renders the brand logo link as a focusable and keyboard-accessible element', () => {
    render(<PublicFooter />);

    const brandLogoLink = screen.getByRole('link', { name: /rpm accesorios inicio/i });
    expect(brandLogoLink).toBeInTheDocument();
    expect(brandLogoLink).toHaveAttribute('href', '/');
    expect(brandLogoLink).toHaveClass('focus-visible:ring-2');
    expect(brandLogoLink).toHaveClass('focus-visible:ring-brand');
    expect(brandLogoLink).toHaveClass('focus-visible:outline-none');
    expect(brandLogoLink).toHaveClass('rounded-lg');
  });

  it('renders all quick navigation links with high-contrast focus-visible rings', () => {
    render(<PublicFooter />);

    const navLinks = [
      { name: /^Catálogo de Productos$/, href: '/productos' },
      { name: /^Nuestros Servicios$/, href: '/servicios' },
      { name: /^Contacto$/, href: '/contacto' },
      { name: /^Sobre Nosotros$/, href: '/nosotros' },
    ];

    navLinks.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:ring-brand');
      expect(link).toHaveClass('focus-visible:outline-none');
      expect(link).toHaveClass('rounded-lg');
    });
  });

  it('renders the email address as an interactive semantic mailto link with screen reader tags', () => {
    render(<PublicFooter />);

    const expectedEmail = PUBLIC_SITE_CONFIG.email;
    const emailLink = screen.getByRole('link', { name: new RegExp(`enviar correo electrónico a ${expectedEmail}`, 'i') });

    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', `mailto:${expectedEmail}`);
    expect(emailLink).toHaveClass('focus-visible:ring-2');
    expect(emailLink).toHaveClass('focus-visible:ring-brand');
    expect(emailLink).toHaveClass('focus-visible:outline-none');
    expect(emailLink).toHaveClass('rounded-lg');
  });
});
