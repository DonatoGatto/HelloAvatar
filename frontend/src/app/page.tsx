import Link from 'next/link';

const FEATURES = [
  {
    icon: '✦',
    title: 'AI Avatar Library',
    desc: '100+ hyper-realistic stock avatars or train your own from a 2-minute video recording.',
    gradient: 'from-indigo-500/10 to-violet-500/5',
    border: 'border-indigo-500/20',
  },
  {
    icon: '◈',
    title: 'Instant Video Generation',
    desc: 'Turn any script into a studio-quality talking-head video in minutes. Export in HD and share anywhere.',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    border: 'border-blue-500/20',
  },
  {
    icon: '⬡',
    title: 'Live Chat Widget',
    desc: 'Embed a real-time AI avatar on any website with 2 lines of code. Drive engagement 10× over text chat.',
    gradient: 'from-violet-500/10 to-pink-500/5',
    border: 'border-violet-500/20',
  },
  {
    icon: '◎',
    title: 'Multi-Language Voices',
    desc: 'ElevenLabs & Edge TTS — 30+ voices in 12+ languages. Every customer hears you in their own language.',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-500/20',
  },
  {
    icon: '⬟',
    title: 'White-Label Ready',
    desc: 'Your branding, your domain. Remove all HelloAvatar marks and deliver a seamless experience to clients.',
    gradient: 'from-orange-500/10 to-amber-500/5',
    border: 'border-orange-500/20',
  },
  {
    icon: '◇',
    title: 'API Access',
    desc: 'Full REST API with API keys per workspace. Integrate avatar video & real-time chat into any product.',
    gradient: 'from-rose-500/10 to-pink-500/5',
    border: 'border-rose-500/20',
  },
];

const STATS = [
  { value: '100+', label: 'Stock Avatars' },
  { value: '30+', label: 'Voice Options' },
  { value: '12+', label: 'Languages' },
  { value: '2 min', label: 'To first video' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-hidden">

      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-black text-xs">HA</span>
          </div>
          <span className="font-bold text-lg tracking-tight">HelloAvatar</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors">Features</a>
          <a href="#pricing" className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative text-center px-4 pt-24 pb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Powered by HeyGen · ElevenLabs · Groq AI
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.08] tracking-tight">
          AI Avatars that<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
            grow your business
          </span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create talking AI avatar videos, embed live chat widgets on your website,
          and personalize every customer interaction — no camera, no studio needed.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
            Start for free — no card needed
          </Link>
          <Link href="/login" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5">
            View demo →
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16">
          {STATS.map((s) => (
            <div key={s.label} className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
              <div className="text-2xl font-black text-indigo-400">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="relative max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">Everything you need</p>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">More powerful than any competitor</h2>
          <p className="text-zinc-500 mt-3 max-w-xl mx-auto">Every feature designed to help you close more sales, support more customers, and scale without extra headcount.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className={`relative bg-gradient-to-br ${f.gradient} border ${f.border} rounded-2xl p-6 group hover:scale-[1.02] transition-transform duration-200`}>
              <div className="text-2xl mb-4 text-zinc-300">{f.icon}</div>
              <h3 className="font-semibold text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages over competitors */}
      <section className="relative max-w-5xl mx-auto px-8 py-16">
        <div className="bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-pink-600/10 border border-white/[0.07] rounded-3xl p-10">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">Why HelloAvatar</p>
          <h2 className="text-3xl font-bold mb-8">Built different. Priced fair.</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-5">
            {[
              'Live real-time voice call with your avatar — not just text',
              'Train a custom avatar from just 2 minutes of video',
              'Embed anywhere with a single script tag',
              'AI persona customization per widget',
              'Full API access on all paid plans',
              'White-label branding — your logo, your domain',
              'Lithuanian, Polish, German & 9 more languages built-in',
              '10× cheaper than HeyGen for similar quality',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-indigo-400 text-xs">✓</span>
                </div>
                <span className="text-zinc-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-zinc-500 mt-3">No hidden fees. Start free, upgrade when you're ready.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free', price: '$0', sub: 'forever', credits: '20 starter credits',
              features: ['5 stock avatars', '20 video credits', 'Embed widget', 'Live chat widget'],
              cta: 'Start free', href: '/register',
            },
            {
              name: 'Starter', price: '$49', sub: '/month', credits: '100 credits/month',
              features: ['All 100+ stock avatars', '1 custom avatar', 'Live chat widget', 'API access', 'Priority processing'],
              cta: 'Get Starter', href: '/register', popular: true,
            },
            {
              name: 'Pro', price: '$149', sub: '/month', credits: '500 credits/month',
              features: ['Unlimited avatars', 'White-label embed', 'Dedicated support', 'All API endpoints', 'Team workspace'],
              cta: 'Go Pro', href: '/register',
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                p.popular
                  ? 'bg-indigo-600/10 border-2 border-indigo-500/50 glow-ring'
                  : 'bg-zinc-900 border border-white/[0.06]'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="font-semibold text-zinc-300 mb-1">{p.name}</div>
              <div className="flex items-end gap-1 mt-1 mb-0.5">
                <span className={`text-4xl font-black ${p.popular ? 'text-indigo-300' : 'text-zinc-100'}`}>{p.price}</span>
                <span className="text-zinc-500 text-sm mb-1.5">{p.sub}</span>
              </div>
              <div className="text-xs text-zinc-500 mb-5">{p.credits}</div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-emerald-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  p.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative text-center px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to talk to your customers?</h2>
          <p className="text-zinc-500 mb-8">Join hundreds of businesses using HelloAvatar to engage, convert, and delight customers at scale.</p>
          <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-indigo-500/30 hover:-translate-y-0.5">
            Create your free workspace →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] px-8 py-8 max-w-7xl mx-auto flex items-center justify-between text-zinc-600 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded flex items-center justify-center">
            <span className="text-white font-black text-[9px]">HA</span>
          </div>
          <span>HelloAvatar © 2026</span>
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
