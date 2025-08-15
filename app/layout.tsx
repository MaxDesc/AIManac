export const metadata = { title: process.env.NEXT_PUBLIC_SITE_NAME || 'AImanac' };
export default function RootLayout({ children }:{ children: React.ReactNode }){
  return (
    <html lang="fr"><body style={{background:'#0b0e14', color:'#e5eef7', fontFamily:'system-ui, Segoe UI, Roboto, sans-serif', padding:16}}>
      <header style={{position:'sticky', top:0, backdropFilter:'blur(6px)', background:'rgba(11,14,20,0.6)', borderBottom:'1px solid #1c2230', marginBottom:16, padding:'10px 0'}}>
        <div style={{fontWeight:700}}>{process.env.NEXT_PUBLIC_SITE_NAME || 'AImanac'}</div>
        <nav style={{display:'flex', gap:12, marginTop:8}}>
          <a href="/" style={{opacity:.9}}>Matchs</a>
          <a href="/value-bets" style={{opacity:.9}}>Value Bets (IA)</a>
        </nav>
      </header>
      <main>{children}</main>
    </body></html>
  );
}
