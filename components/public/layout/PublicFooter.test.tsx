import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicFooter } from './PublicFooter';
import React from 'react';

describe('PublicFooter', () => {
  it('renders brand logo link with appropriate routing and keyboard accessibility focus states', () => {
    render(<PublicFooter />);

    const logoLink = screen.getByRole('link', { name: /rpm accesorios - volver al inicio/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
    expect(logoLink).toHaveClass('focus-visible:ring-2');
  });

  it('renders all main navigation links with keyboard accessibility focus states', () => {
    render(<PublicFooter />);

    const links = [
      { name: /^catálogo de productos$/i, href: '/productos' },
      { name: /^nuestros servicios$/i, href: '/servicios' },
      { name: /^contacto$/i, href: '/contacto' },
      { name: /^sobre nosotros$/i, href: '/nosotros' },
    ];

    links.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveClass('focus-visible:ring-2');
    });
  });

  it('renders contact section with phone and email semantic links and focus outlines', () => {
    render(<PublicFooter />);

    const phoneLink = screen.getByRole('link', { name: /llamar o enviar whatsapp al/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveClass('focus-visible:ring-2');

    const emailLink = screen.getByRole('link', { name: /enviar correo electrónico a/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
    expect(emailLink).toHaveClass('focus-visible:ring-2');
  });
});
