import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased" suppressHydrationWarning>
      <head>
        <title>CacheRing — Distributed Key-Value Cluster with Consistent Hashing</title>
        <meta
          name="description"
          content="Distributed in-memory cache cluster featuring Murmur3 consistent hashing ring topology, dynamic node scaling, and zero-downtime key partition rebalancing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (name === 'bis_skin_checked' || name === 'data-bis-skin-checked') {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };
                } catch (e) {}

                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver(function(mutations) {
                    for (let i = 0; i < mutations.length; i++) {
                      const m = mutations[i];
                      if (m.type === 'attributes' && (m.attributeName === 'bis_skin_checked' || m.attributeName === 'data-bis-skin-checked')) {
                        m.target.removeAttribute(m.attributeName);
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked', 'data-bis-skin-checked']
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

