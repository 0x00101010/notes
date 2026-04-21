import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute('data-theme') !== 'dark');
  }, []);

  const toggle = () => {
    const next = light ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setLight(!light);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--muted)',
        fontSize: 18,
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        lineHeight: 1,
        padding: 0,
      }}
    >
      {light ? '\u263e' : '\u2600'}
    </button>
  );
}
