import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-900 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-brand-600 font-black text-sm">HA</span>
          </div>
          <span className="font-bold text-xl">HelloAvatar</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium">Sign in</Link>
          <Link href="/register" className="bg-white text-brand-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 pt-20 pb-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Powered by HeyGen + ElevenLabs
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          AI Avatars for<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-pink-300">
            Your Business
          </span>
        </h1>
        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
          Create talking AI avatar videos, embed live chat widgets on your website,
          and personalize every customer interaction — no camera needed.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-white text-brand-700 px-8 py-3 rounded-xl font-bold text-lg hover:bg-brand-50 transition-colors shadow-xl">
            Start for free →
          </Link>
          <Link href="/login" className="border border-white/30 px-8 py-3 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
            View demo
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-8 pb-24">
        {[
          { icon: '🎭', title: 'AI Avatar Library', desc: '100+ stock avatars or create your own from a 2-5 min video upload.' },
          { icon: '🎬', title: 'Video Generation', desc: 'Turn any text into a talking-head video in minutes. Export & share.' },
          { icon: '💬', title: 'Live Chat Widget', desc: 'Embed a real-time talking avatar on your website in 2 lines of code.' },
        ].map((f, i) => (
          <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-white/70 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-white/5 py-16 px-8">
        <h2 className="text-3xl font-bold text-center mb-10">Simple pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Free', price: '$0', credits: '20 credits', features: ['5 stock avatars', 'Video generation', 'Embed widget'], cta: 'Start free', href: '/register' },
            { name: 'Starter', price: '$49/mo', credits: '100 credits/mo', features: ['All stock avatars', '1 custom avatar', 'Live chat', 'API access'], cta: 'Get started', href: '/register', popular: true },
            { name: 'Pro', price: '$149/mo', credits: '500 credits/mo', features: ['Unlimited avatars', 'Priority processing', 'White-label', 'Dedicated support'], cta: 'Go Pro', href: '/register' },
          ].map((p, i) => (
            <div key={i} className={`rounded-2xl p-6 border ${p.popular ? 'bg-white text-gray-900 border-white scale-105 shadow-2xl' : 'bg-white/10 border-white/20'}`}>
              {p.popular && <div className="text-brand-600 text-xs font-bold uppercase tracking-wider mb-2">Most Popular</div>}
              <h3 className={`font-bold text-xl ${p.popular ? 'text-gray-900' : ''}`}>{p.name}</h3>
              <div className={`text-3xl font-black mt-2 mb-1 ${p.popular ? 'text-brand-600' : ''}`}>{p.price}</div>
              <div className={`text-sm mb-4 ${p.popular ? 'text-gray-500' : 'text-white/70'}`}>{p.credits}</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, j) => (
                  <li key={j} className={`text-sm flex items-center gap-2 ${p.popular ? 'text-gray-700' : 'text-white/80'}`}>
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className={`block text-center py-2.5 rounded-lg font-semibold transition-colors ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white/20 hover:bg-white/30'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
