/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

// Types
type Step = 'LANDING' | 'WRITE' | 'COLLECTION' | 'LOADING' | 'SUCCESS' | 'ARCHIVE' | 'SOCIAL';

interface Submission {
  text: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  city?: string;
  age?: string;
}

const COUNTRY_CODES = [
  { code: '+62', name: 'Indonesia' },
  { code: '+60', name: 'Malaysia' },
  { code: '+65', name: 'Singapore' },
  { code: '+61', name: 'Australia' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
];

const ARCHIVE_SEEDS = [
  { text: "Terima kasih sudah selalu ada, walau hanya lewat silent support yang kadang bikin aku bingung sendiri.", city: "Jakarta", age: "26" },
  { text: "Aku nggak pernah bilang, tapi aku bangga banget jadi anak Ayah.", city: "Bandung", age: "23" },
  { text: "Maaf ya Yah, aku belum bisa jadi seperti yang Ayah mau. Tapi aku lagi usaha.", city: "Yogyakarta", age: "21" },
  { text: "Kenapa sih Ayah nggak pernah mau kelihatan capek di depan kita? Padahal kita tahu.", city: "Surabaya", age: "28" },
  { text: "Kadang aku rindu masakan nasi goreng Ayah yang gosong dikit itu.", city: "Semarang", age: "25" },
  { text: "Aku ingin Ayah tahu kalau aku sudah memaafkan semuanya. Kita mulai dari awal lagi ya?", city: "Malang", age: "29" },
  { text: "Ayah, doakan aku dari sana ya. Aku kangen banget.", city: "Denpasar", age: "30" },
  { text: "Waktu Ayah bilang 'hati-hati di jalan', aku dengarnya 'Ayah sayang kamu'.", city: "Medan", age: "24" },
];

const PREDETERMINED_CARDS = [
  "https://i.imgur.com/g5h5GPo.png",
  "https://i.imgur.com/LusXz2Q.png",
  "https://i.imgur.com/ofwuItm.png",
  "https://i.imgur.com/W5QhTaV.png",
  "https://i.imgur.com/jwCs2GW.png",
  "https://i.imgur.com/nJSJIXs.png",
  "https://i.imgur.com/4YNml8n.png",
  "https://i.imgur.com/RrAOMCi.png",
  "https://i.imgur.com/40L63Vk.png",
  "https://i.imgur.com/IjFokz1.png",
  "https://i.imgur.com/c98euJS.png",
  "https://i.imgur.com/GWff4TU.png",
  "https://i.imgur.com/f3BqlPu.png",
  "https://i.imgur.com/Zwoz2ZB.png",
  "https://i.imgur.com/TfiUw1C.png",
  "https://i.imgur.com/Ml4wgpM.png",
  "https://i.imgur.com/0l8k2oG.png",
  "https://i.imgur.com/3iFDhUs.png",
  "https://i.imgur.com/FvVO2To.png",
];

export default function App() {
  const [step, setStep] = useState<Step>('LANDING');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [formData, setFormData] = useState<Submission>({
    text: '',
    name: '',
    email: '',
    phone: '',
    countryCode: '+62',
  });

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Be more forgiving with formatting (spaces, dashes, dots, plus)
    const cleaned = phone.replace(/[\s\-.\+]/g, '');
    return /^[0-9]{7,15}$/.test(cleaned);
  };

  const isFormValid = () => {
    return formData.name.trim().length > 1 && 
           isValidEmail(formData.email) && 
           isValidPhone(formData.phone);
  };

  // Auto-detect country code from phone input
  useEffect(() => {
    const phone = formData.phone.trim();
    if (!phone) return;

    // Handle numbers starting with + (e.g., +62...)
    if (phone.startsWith('+')) {
      const match = COUNTRY_CODES.find(c => phone.startsWith(c.code));
      if (match) {
        setFormData(prev => ({
          ...prev,
          countryCode: match.code,
          phone: phone.substring(match.code.length).trim()
        }));
      }
      return;
    }

    // Handle numbers starting with 00 (e.g., 0062...)
    if (phone.startsWith('00')) {
      const phoneWithPlus = phone.replace('00', '+');
      const match = COUNTRY_CODES.find(c => phoneWithPlus.startsWith(c.code));
      if (match) {
        setFormData(prev => ({
          ...prev,
          countryCode: match.code,
          phone: phone.substring(match.code.length + 1).trim()
        }));
      }
      return;
    }

    // Handle local autofills that might include the country code without plus (e.g., 62812...)
    // We only do this for longer strings to avoid catching local numbers accidentally
    if (phone.length > 8) {
      const matchNoPlus = COUNTRY_CODES.find(c => {
        const codeNoPlus = c.code.replace('+', '');
        return phone.startsWith(codeNoPlus) && codeNoPlus.length > 1; // skip +1
      });

      if (matchNoPlus) {
        const codeNoPlus = matchNoPlus.code.replace('+', '');
        // Only strip if the remaining part looks like a valid local number
        if (phone.length - codeNoPlus.length >= 7) {
          setFormData(prev => ({
            ...prev,
            countryCode: matchNoPlus.code,
            phone: phone.substring(codeNoPlus.length).trim()
          }));
        }
      }
    }
  }, [formData.phone]);

  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleDownloadCard = async () => {
    if (cardRef.current) {
      try {
        // Find the image and set crossOrigin ONLY for the capture duration
        const img = cardRef.current.querySelector('img');
        if (img) {
          img.crossOrigin = "anonymous";
        }

        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#FAF8F4',
          scale: 3, // High quality
          useCORS: true,
          logging: false,
        });

        // Clean up or keep as is if we don't mind the potential reload
        const link = document.createElement('a');
        link.download = `pesan-untuk-ayah-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to export card', err);
      }
    }
  };

  const nextStep = (next: Step) => {
    
    if (next === 'LOADING') {
      // Pick card immediately to start pre-loading while user sees the loading bar
      const randomIndex = Math.floor(Math.random() * PREDETERMINED_CARDS.length);
      const url = PREDETERMINED_CARDS[randomIndex];
      setSelectedCard(url);
      
      setStep('LOADING');
      // Preload image manually to ensure it's ready
      const img = new Image();
      img.src = url;
      
      // Simulate processing time
      setTimeout(() => {
        setStep('SUCCESS');
      }, 2500);
      return;
    }
    if (next === 'SUCCESS') {
      if (!selectedCard) {
        const randomIndex = Math.floor(Math.random() * PREDETERMINED_CARDS.length);
        setSelectedCard(PREDETERMINED_CARDS[randomIndex]);
      }
    }
    if (next === 'LANDING') {
      setFormData({
        text: '',
        name: '',
        email: '',
        phone: '',
        countryCode: '+62',
      });
    }
    setStep(next);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

  // --- COMPONENTS ---

  const ProgressDots = ({ current }: { current: number }) => (
    <div className="flex gap-1.5 mb-12">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= current ? 'bg-brand-text' : 'bg-brand-border'
          }`}
        />
      ))}
    </div>
  );
  const handleSubmit = async () => {
  try {
    await fetch("https://script.google.com/macros/s/AKfycbw6CCsK1ZR-OeuCn7uD2OavN6ZeS7oNIE_mxVlbIU2LiCafV2i0v-0MGyx32vx4q-11Xw/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    nextStep('LOADING'); // only move after success
  } catch (err) {
    console.error("Submit failed", err);
    nextStep('LOADING'); // still continue (optional)
  }
};

  return (
    <main className="min-h-screen max-w-[600px] mx-auto px-6 pt-4 pb-12 md:px-12 flex flex-col font-sans selection:bg-brand-text selection:text-brand-bg">
      {/* PERSISTENT HEADER */}
      <div className="flex justify-center items-center mb-4">
        <img 
          src="https://i.imgur.com/FbpA7ea.png" 
          alt="Logo" 
          className="h-24 w-auto object-contain cursor-pointer"
          onClick={() => nextStep('LANDING')}
          referrerPolicy="no-referrer"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* SCREEN 1: LANDING */}
        {step === 'LANDING' && (
          <motion.div
            key="landing"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col items-center justify-center flex-1 text-center py-6"
          >
            <div className="flex flex-col items-center max-w-md">
              <div className="w-full max-w-[192px] mb-6 mx-auto">
                <img 
                  src="https://i.imgur.com/S4dI9Dz.png" 
                  alt="Feature Visual" 
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted mb-4">
                SEBUAH ARSIP —
              </span>
              <h1 className="serif text-[42px] leading-tight mb-6 font-normal">
                Pesan Tak Terkirim
              </h1>
              <p className="text-[15px] text-brand-muted mb-8 leading-relaxed">
                Ribuan hal tersimpan antara anak dan ayah. Kami sedang mengumpulkannya.
              </p>
              <div className="w-12 border-t-thin mb-8"></div>
              <p className="text-[12px] text-brand-muted italic mb-10 leading-relaxed">
                Beberapa di antaranya akan kami kirimkan sesuatu —<br />
                sebagai tanda bahwa pesanmu sudah sampai.
              </p>
              <div>
                <button
                  onClick={() => nextStep('WRITE')}
                  className="border-thin border-brand-text px-8 py-3 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200"
                >
                  Tulis milikmu →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: WRITE */}
        {step === 'WRITE' && (
          <motion.div
            key="write"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1"
          >
            <ProgressDots current={1} />
            <h2 className="serif text-2xl leading-snug mb-2">
              Satu hal yang belum pernah kamu ucapkan ke ayahmu —
            </h2>
            <p className="text-[13px] text-brand-muted mb-10">
              Bisa tentang apa saja. Tidak ada yang salah di sini.
            </p>
            
            <div className="relative flex-1 min-h-[300px]">
              <textarea
                autoFocus
                placeholder="Tulis di sini..."
                className="w-full bg-transparent border-b-thin focus:border-brand-text outline-none text-[18px] min-h-[140px] resize-none pb-4 transition-colors"
                maxLength={280}
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              />
              <div className="text-right mt-2">
                <span className="text-[12px] text-brand-muted">
                  {formData.text.length} / 280
                </span>
              </div>
            </div>

            <div className="mt-auto py-8 text-right">
              <button
                disabled={formData.text.length < 5}
                onClick={() => nextStep('COLLECTION')}
                className="border-thin border-brand-text px-8 py-3 text-[13px] disabled:opacity-30 hover:bg-brand-text hover:text-brand-bg transition-all duration-200"
              >
                Lanjut →
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3: DATA COLLECTION */}
        {step === 'COLLECTION' && (
          <motion.div
            key="collection"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1"
          >
            <ProgressDots current={2} />
            <h2 className="serif text-xl mb-2">Hampir selesai.</h2>
            <p className="text-[13px] text-brand-muted mb-12">
              Siapa nama kamu, dan ke mana kami bisa kabar kalau kamu menang sesuatu?
            </p>

            <div className="space-y-10">
              <div className="flex flex-col">
                <label htmlFor="name" className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">NAMA</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  placeholder="Nama lengkap kamu"
                  className="bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">EMAIL</label>
                <input
                  id="email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="Alamat email aktif"
                  className="bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {!isValidEmail(formData.email) && formData.email.length > 0 && (
                  <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">Format email tidak valid</span>
                )}
              </div>
              <div className="flex flex-col">
                <label htmlFor="countryCode" className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">NOMOR HP</label>
                <div className="flex gap-3 items-end">
                  <select
                    id="countryCode"
                    name="countryCode"
                    autoComplete="tel-country-code"
                    className="bg-transparent border-b-thin border-brand-border focus:border-brand-text outline-none py-2 text-[14px] transition-colors cursor-pointer appearance-none"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code} className="bg-brand-bg text-brand-text">
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    name="phone"
                    autoComplete="tel-national"
                    type="tel"
                    placeholder="Contoh: 812xxxx"
                    className="flex-1 bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {!isValidPhone(formData.phone) && formData.phone.length > 0 && (
                  <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">Format nomor tidak valid</span>
                )}
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center bg-brand-bg relative z-10">
              <p className="text-[11px] text-brand-muted">
                Datamu aman bersama kami.
              </p>
              <button
                disabled={!isFormValid()}
                onClick={handleSubmit}
                
                
                className="bg-brand-text text-brand-bg px-8 py-3 text-[13px] disabled:opacity-30 hover:opacity-90 transition-all duration-200"
              >
              
                Kirim →
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3.5: LOADING */}
        {step === 'LOADING' && (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1 items-center justify-center py-40"
          >
            <div className="w-full max-w-[200px]">
              <div className="mb-6 text-center">
                <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">Menghimpun Pesan</span>
              </div>
              <div className="h-[1px] w-full bg-brand-border relative overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-brand-text w-1/3"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN 4: SUCCESS + CARD */}
        {step === 'SUCCESS' && (
          <motion.div
            key="success"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1"
          >
            <div className="mb-2">—</div>
            <h2 className="serif text-[26px] mb-2 leading-tight">Sudah tersimpan.</h2>
            <p className="text-[14px] text-brand-muted mb-8">Kata-katamu sekarang bagian dari arsip ini.</p>
            
            <div className="flex flex-col space-y-4 items-center">
              <span className="text-[11px] uppercase tracking-widest text-brand-muted w-full text-center">INI MILIKMU</span>
              
              {/* THE CARD */}
              <div 
                ref={cardRef}
                className="aspect-[4/5] w-full max-w-[320px] relative overflow-hidden rounded-sm shadow-xl"
              >
                <img 
                  src={selectedCard} 
                  alt="Shareable Card" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-8 text-center w-full">
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleDownloadCard}
                    className="border-thin border-brand-text py-3 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all"
                  >
                    Simpan card →
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-t-[0.5px] border-brand-border mt-12 mb-8" />

            <div className="flex flex-col gap-6 pb-12">
              <button
                onClick={() => nextStep('SOCIAL')}
                className="w-full text-center text-[13px] text-brand-text hover:opacity-70 transition-opacity font-medium"
              >
                Ikuti perjalanan kami →
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 5: ARCHIVE */}
        {step === 'ARCHIVE' && (
          <motion.div
            key="archive"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1"
          >
            <div className="pt-6">
              <span className="text-[11px] uppercase tracking-widest text-brand-muted mb-4 opacity-70 block">ARSIP</span>
              <p className="text-[14px] text-brand-muted mb-12">
                Ini adalah pesan-pesan yang tak terkirim. Ditulis oleh orang-orang seperti kamu.
              </p>
            </div>

            <div className="space-y-0">
              {[...ARCHIVE_SEEDS, { text: formData.text, city: "Kamu", age: "Now" }].filter(s => s.text).map((item, i) => (
                <div key={i} className="group">
                  <div className="py-10">
                    <p className="serif text-[17px] leading-relaxed italic mb-3">
                      "{item.text}"
                    </p>
                    <span className="text-[11px] text-brand-muted tracking-tight">
                      {item.city} · {item.age}
                    </span>
                  </div>
                  {i < ARCHIVE_SEEDS.length && (
                    <hr className="border-t-[0.5px] border-brand-border opacity-60" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-20 pt-8 border-t-thin pb-20 text-center">
              <button
                onClick={() => nextStep('LANDING')}
                className="text-[13px] text-brand-muted hover:text-brand-text transition-colors"
              >
                Kembali ke Beranda →
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 6: SOCIAL MEDIA */}
        {step === 'SOCIAL' && (
          <motion.div
            key="social"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="flex flex-col flex-1"
          >
            <div className="mb-12 text-center">
              <h2 className="serif text-[28px] mb-4 leading-tight">Cerita kita tidak berakhir di sini.</h2>
              <p className="text-[14px] text-brand-muted mb-4 leading-relaxed">
                Bagaimana kalau ayahmu juga punya pesan yang tak terkirim?
              </p>
              <p className="text-[14px] text-brand-muted mb-10 leading-relaxed mx-auto max-w-[400px]">
                Buku ini ditulis untuk menjawab pertanyaan yang jarang berani kita tanyakan.
              </p>

              {/* BOOK COVER IMAGE */}
              <div className="w-full max-w-[280px] aspect-[4/5] mb-12 rounded-sm overflow-hidden mx-auto">
                <img 
                  src="https://i.imgur.com/HZ6WQQy.png" 
                  alt="Pesan Tak Terkirim" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full h-[0.5px] bg-brand-border opacity-50 mb-12"></div>

              <p className="text-[12px] text-brand-muted mb-8 leading-relaxed italic text-center">
                Ikuti terus perjalanan kami mengumpulkan pesan-pesan yang tak terkirim di platform media sosial.
              </p>

              <div className="flex flex-col gap-4">
                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() => window.open('https://linktr.ee/ayahparuhwaktu', '_blank')}
                >
                  <span className="font-semibold tracking-[0.1em]">LINKTREE</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() => window.open('https://www.tiktok.com/@ayahparuhwaktu', '_blank')}
                >
                  <span className="font-semibold tracking-[0.1em]">TIKTOK</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() => window.open('https://instagram.com/ayahparuhwaktu', '_blank')}
                >
                  <span className="font-semibold tracking-[0.1em]">INSTAGRAM</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t-thin pb-20 text-center">
              <button
                onClick={() => nextStep('ARCHIVE')}
                className="text-[13px] text-brand-muted hover:text-brand-text transition-colors"
              >
                Lihat Arsip →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
