"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (e) {}
  }, []);



  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[var(--background-dark)]/80 backdrop-blur-md border-b border-[#f0f0f4] dark:border-white/10">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="bg-[#3b82f6] p-1.5 rounded-lg" />
              <h1 className="text-[var(--foreground)] dark:text-white text-lg font-bold leading-tight">Social Flow</h1>
            </div>
            <div></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <section className="px-4 py-12 md:py-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex flex-col gap-6 md:w-1/2">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)] dark:text-white">Social Flow: The Future of AI Social Media</h1>
                <p className="text-[#616189] dark:text-gray-400 text-lg">Automate your presence and monetize on-chain effortlessly with AI-driven content generation and seamless Web3 integration.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/generator" className="flex items-center justify-center bg-[#3b82f6] hover:bg-[#2563eb] text-white h-14 px-8 rounded-xl font-bold text-lg hover:shadow-lg transition-all">Get Started</Link>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#3b82f6]/20 rounded-full blur-3xl opacity-30"></div>
                <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#111118] flex items-center justify-center p-8">
                    <span className="material-symbols-outlined text-[120px] text-white/20">auto_awesome</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <h2 className="text-[var(--foreground)] dark:text-white text-4xl md:text-5xl font-black mb-8 text-center">Core Strengths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-[#f0f0f4] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full aspect-video rounded-xl mb-6 bg-[#3b82f6]/5 flex items-center justify-center overflow-hidden">
                <div className="bg-white dark:bg-[var(--background-dark)] p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-[#f0f0f4] dark:border-white/10">
                  <span className="material-symbols-outlined text-[#3b82f6] text-4xl">neurology</span>
                  <div>
                    <div className="h-2 w-24 bg-[#3b82f6]/20 rounded-full mb-2"></div>
                    <div className="h-2 w-16 bg-[#3b82f6]/10 rounded-full"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--foreground)] dark:text-white">AI Turning</h3>
              <p className="text-[#616189] dark:text-gray-400">Transform your raw ideas into viral, engagement-optimized posts using advanced LLMs tailored for social platforms.</p>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-[#f0f0f4] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full aspect-video rounded-xl mb-6 bg-[#3b82f6]/5 flex items-center justify-center overflow-hidden">
                <div className="bg-white dark:bg-[var(--background-dark)] p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-[#f0f0f4] dark:border-white/10">
                  <span className="material-symbols-outlined text-[#3b82f6] text-4xl">payments</span>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-[10px] text-white border-2 border-white font-bold">ETH</div>
                    <div className="w-8 h-8 rounded-full bg-[#26a17b] flex items-center justify-center text-[10px] text-white border-2 border-white font-bold">USDT</div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--foreground)] dark:text-white">On-chain Payments</h3>
              <p className="text-[#616189] dark:text-gray-400">Enable seamless Web3 tipping, gate content with NFTs, and manage subscription revenue through secure smart contracts.</p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <h2 className="text-[var(--foreground)] dark:text-white text-4xl md:text-5xl font-black mb-8 text-center">Three Simple Steps</h2>
          <div className="flex flex-col gap-8 max-w-md mx-auto">
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-[#f0f0f4] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-xl">1</div>
                <div className="w-px h-full bg-[#3b82f6]/30 my-2"></div>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1 text-[var(--foreground)] dark:text-white">Connect</h4>
                <p className="text-[#616189] dark:text-gray-400">Link your Web3 wallet and your social media accounts to get started.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-[#f0f0f4] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-xl">2</div>
                <div className="w-px h-full bg-[#3b82f6]/30 my-2"></div>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1 text-[var(--foreground)] dark:text-white">Generate</h4>
                <p className="text-[#616189] dark:text-gray-400">Input your core message and let our AI craft the perfect narrative for your audience.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-[#f0f0f4] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-xl">3</div>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-1 text-[var(--foreground)] dark:text-white">Post</h4>
                <p className="text-[#616189] dark:text-gray-400">Schedule or publish directly on-chain and across mainstream social platforms.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 border-y border-[#f0f0f4] dark:border-white/10 overflow-hidden">
          <p className="text-center text-xs font-bold text-[#616189] uppercase tracking-widest mb-8">Built With Modern Stack</p>
          <div className="marquee-container">
            <div className="marquee-content flex gap-12 items-center">
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70">Next.js</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70 flex items-center gap-2"><span className="material-symbols-outlined">shield</span> Thirdweb</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70">Tailwind CSS</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70">Bun.sh</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70">OpenAI</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70">Next.js</span>
              <span className="text-2xl font-bold text-[var(--foreground)] dark:text-white/50 opacity-70 flex items-center gap-2"><span className="material-symbols-outlined">shield</span> Thirdweb</span>
            </div>
          </div>
        </section>

        <footer className="py-16 px-4 bg-white dark:bg-[var(--background-dark)]">
          <div className="bg-[#3b82f6] rounded-3xl p-8 md:p-16 flex flex-col items-center text-center gap-8">
            <h2 className="text-3xl md:text-5xl font-black text-white max-w-2xl">Ready to automate your social growth?</h2>
            <p className="text-white/80 max-w-md">Join hundreds of creators monetizing their content with AI and Web3 integration.</p>
            <Link href="/generator" className="bg-white text-[#3b82f6] px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl inline-block">Get Started</Link>
          </div>
          <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-[#616189] dark:text-gray-400">
            <div className="flex items-center gap-2"><div className="bg-[#3b82f6] text-white p-1 rounded-lg"></div><span className="font-bold text-[var(--foreground)] dark:text-white">Social Flow</span></div>
            <div className="flex gap-6"><a className="hover:text-[#3b82f6] transition-colors" href="#">Twitter</a><a className="hover:text-[#3b82f6] transition-colors" href="#">Discord</a><a className="hover:text-[#3b82f6] transition-colors" href="#">GitHub</a></div>
            <p className="text-sm">© 2024 Social Flow Inc.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
