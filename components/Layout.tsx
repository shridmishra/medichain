import React, { ReactNode } from 'react';
import Head from 'next/head';

type Props = {
  children?: ReactNode;
  title?: string;
};

// Simplified Layout: provides Head and a main wrapper.
// Assumes font is applied by a parent component (e.g., in _app.tsx)
// Header and Footer are removed; pages should define their own or use specific header/footer components.
const Layout = ({ children, title = 'Medichain' }: Props) => (
  <>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      {/* Favicon and other global meta tags can go here */}
    </Head>
    <main className="flex-grow"> {/* Removed container and padding, pages will control this */}
      {children}
    </main>
  </>
);

export default Layout; 