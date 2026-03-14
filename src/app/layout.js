import './globals.css';

export const metadata = {
  title: {
    default: 'PageAmpHTML - Static HTML Hosting',
    template: '%s | PageAmpHTML',
  },
  description: 'Deploy static HTML pages instantly with custom subdomains. Simple, fast, and free hosting for your HTML projects.',
  keywords: ['html hosting', 'static hosting', 'subdomain', 'deploy', 'web hosting'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-surface-50">
        {children}
      </body>
    </html>
  );
}
