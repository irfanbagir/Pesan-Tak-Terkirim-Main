/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

type Step =
  | 'LANDING'
  | 'WRITE'
  | 'COLLECTION'
  | 'LOADING'
  | 'SUCCESS'
  | 'ARCHIVE'
  | 'SOCIAL';

interface Submission {
  text: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  city?: string;
  age?: string;
}

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbziFvnIyZLrW_REAO6t4fYPEsz5vyHiPgU1T6d05DpVBaeZWYAHY9c7Zlr1TVax9lzAvw/exec';

const COUNTRY_CODES = [
  { code: '+62', name: 'Indonesia' },
  { code: '+60', name: 'Malaysia' },
  { code: '+65', name: 'Singapore' },
  { code: '+61', name: 'Australia' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
];

const PREDETERMINED_CARDS = Array.from(
  { length: 40 },
  (_, i) => `/images/cards/${i + 1}.png`
);

const ARCHIVE_SEEDS = [
  {
    text: 'Terima kasih sudah selalu ada, walau hanya lewat silent support yang kadang bikin aku bingung sendiri.',
    city: 'Jakarta',
    age: '26',
  },
  {
    text: 'Aku nggak pernah bilang, tapi aku bangga banget jadi anak Ayah.',
    city: 'Bandung',
    age: '23',
  },
  {
    text: 'Maaf ya Yah, aku belum bisa jadi seperti yang Ayah mau. Tapi aku lagi usaha.',
    city: 'Yogyakarta',
    age: '21',
  },
];

export default function App() {
  const [step, setStep] = useState<Step>('LANDING');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [isWinner, setIsWinner] = useState(false);
  const [prizeImage, setPrizeImage] = useState<string>('');
  const [submissionNumber, setSubmissionNumber] = useState<number | null>(null);

  const [formData, setFormData] = useState<Submission>({
    text: '',
    name: '',
    email: '',
    phone: '',
    countryCode: '+62',
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-.\+]/g, '');
    return /^[0-9]{7,15}$/.test(cleaned);
  };

  const isFormValid = () => {
    return (
      formData.name.trim().length > 1 &&
      isValidEmail(formData.email) &&
      (formData.phone.trim() === '' || isValidPhone(formData.phone))
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const submitToAppsScript = async (cardUrl: string) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          text: formData.text,
          name: formData.name,
          email: formData.email,
          countryCode: formData.countryCode,
          phone: formData.phone,
          city: formData.city || '',
          age: formData.age || '',
          selectedCard: cardUrl,
          createdAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      console.log('✅ Apps Script result:', result);

      setSubmissionNumber(result.submissionNumber || null);

      if (result.isWinner) {
        setIsWinner(true);
        const rawPrize = String(result.prize || '').trim().toLowerCase();

const cleanPrize = rawPrize.startsWith('prize')
  ? rawPrize
  : `prize${rawPrize}`;

setPrizeImage(`/images/prizes/${cleanPrize}.png`);
console.log("Prize:", result.prize);
console.log("Image path:", `/images/prizes/${cleanPrize}.png`);
      } else {
        setIsWinner(false);
        setPrizeImage('');
        
      }
    } catch (err) {
      console.error('❌ Apps Script error:', err);
      setIsWinner(false);
      setPrizeImage('');
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#FAF8F4',
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `pesan-untuk-ayah-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export card', err);
    }
  };

  const nextStep = (next: Step) => {
    if (next === 'LOADING') {
      const randomIndex = Math.floor(Math.random() * PREDETERMINED_CARDS.length);
      const url = PREDETERMINED_CARDS[randomIndex];

      setSelectedCard(url);
      setStep('LOADING');

      const img = new Image();
      img.src = url;

      submitToAppsScript(url);

      setTimeout(() => {
        setStep('SUCCESS');
      }, 2500);

      return;
    }

    if (next === 'LANDING') {
      setFormData({
        text: '',
        name: '',
        email: '',
        phone: '',
        countryCode: '+62',
      });

      setSelectedCard('');
      setIsWinner(false);
      setPrizeImage('');
      setSubmissionNumber(null);
    }

    setStep(next);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const transition = {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  };

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

  return (
    <main className="min-h-screen max-w-[600px] mx-auto px-6 pt-4 pb-12 md:px-12 flex flex-col font-sans selection:bg-brand-text selection:text-brand-bg">
      <div className="flex justify-center items-center mb-4">
        <img
          src="/images/ui/logo.png"
          alt="Logo"
          className="h-24 w-auto object-contain cursor-pointer"
          onClick={() => nextStep('LANDING')}
        />
      </div>

      <AnimatePresence mode="wait">
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
                  src="/images/ui/heart.png"
                  alt="Feature Visual"
                  className="w-full h-auto object-contain"
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
                Beberapa di antaranya akan kami kirimkan sesuatu —
                <br />
                sebagai tanda bahwa pesanmu sudah sampai.
              </p>

              <button
                onClick={() => nextStep('WRITE')}
                className="border-thin border-brand-text px-8 py-3 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200"
              >
                Tulis milikmu →
              </button>
            </div>
          </motion.div>
        )}

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
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
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
                <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">
                  NAMA
                </label>

                <input
                  type="text"
                  placeholder="Nama lengkap kamu"
                  className="bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">
                  EMAIL
                </label>

                <input
                  type="email"
                  placeholder="Alamat email aktif"
                  className="bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />

                {!isValidEmail(formData.email) && formData.email.length > 0 && (
                  <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">
                    Format email tidak valid
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-medium">
                  NOMOR HP OPSIONAL
                </label>

                <div className="flex gap-3 items-end">
                  <select
                    className="bg-transparent border-b-thin border-brand-border focus:border-brand-text outline-none py-2 text-[14px] transition-colors cursor-pointer"
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    placeholder="Nomor HP boleh dikosongkan"
                    className="flex-1 bg-transparent border-b-thin focus:border-brand-text outline-none py-2 text-[14px] transition-colors"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                {!isValidPhone(formData.phone) && formData.phone.length > 0 && (
                  <span className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">
                    Format nomor tidak valid
                  </span>
                )}
              </div>
            </div>

            <div className="mt-10 flex justify-between items-center bg-brand-bg relative z-10">
              <p className="text-[11px] text-brand-muted">
                Datamu aman bersama kami.
              </p>

              <button
                disabled={!isFormValid()}
                onClick={() => nextStep('LOADING')}
                className="bg-brand-text text-brand-bg px-8 py-3 text-[13px] disabled:opacity-30 hover:opacity-90 transition-all duration-200"
              >
                Kirim →
              </button>
            </div>
          </motion.div>
        )}

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
                <span className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">
                  Menghimpun Pesan
                </span>
              </div>

              <div className="h-[1px] w-full bg-brand-border relative overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-brand-text w-1/3"
                />
              </div>
            </div>
          </motion.div>
        )}

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

            <h2 className="serif text-[26px] mb-2 leading-tight">
              Sudah tersimpan.
            </h2>

            <p className="text-[14px] text-brand-muted mb-8">
              Kata-katamu sekarang bagian dari arsip ini.
            </p>

            

            <div className="flex flex-col space-y-4 items-center">
              <span className="text-[11px] uppercase tracking-widest text-brand-muted w-full text-center">
                INI MILIKMU
              </span>

              <div
                ref={cardRef}
                className="aspect-[4/5] w-full max-w-[320px] relative overflow-hidden rounded-sm shadow-xl"
              >
                <img
                  src={selectedCard}
                  alt="Shareable Card"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('✅ Image loaded:', selectedCard)}
                  onError={() => console.log('❌ Image failed:', selectedCard)}
                />
              </div>

              {isWinner && prizeImage && (
  <div className="mt-8 text-center w-full">
    <h3 className="serif text-[24px] mb-2 leading-tight">
      Selamat, kamu menang!
    </h3>

    <p className="text-[13px] text-brand-muted mb-4">
      Kamu mendapatkan hadiah ini:
    </p>

    <img
      src={prizeImage}
      alt="Prize"
      className="w-full max-w-[260px] mx-auto rounded-sm shadow-xl"
      onLoad={() => console.log("✅ Prize loaded:", prizeImage)}
      onError={() => console.log("❌ Prize failed:", prizeImage)}
    />
  </div>
)}

              <div className="mt-8 text-center w-full">
                <button
                  onClick={handleDownloadCard}
                  className="w-full border-thin border-brand-text py-3 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all"
                >
                  Simpan card →
                </button>
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
              <span className="text-[11px] uppercase tracking-widest text-brand-muted mb-4 opacity-70 block">
                ARSIP
              </span>

              <p className="text-[14px] text-brand-muted mb-12">
                Ini adalah pesan-pesan yang tak terkirim. Ditulis oleh orang-orang seperti kamu.
              </p>
            </div>

            <div className="space-y-0">
              {[...ARCHIVE_SEEDS, { text: formData.text, city: 'Kamu', age: 'Now' }]
                .filter((s) => s.text)
                .map((item, i) => (
                  <div key={i} className="group">
                    <div className="py-10">
                      <p className="serif text-[17px] leading-relaxed italic mb-3">
                        "{item.text}"
                      </p>

                      <span className="text-[11px] text-brand-muted tracking-tight">
                        {item.city} · {item.age}
                      </span>
                    </div>
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
              <h2 className="serif text-[28px] mb-4 leading-tight">
                Cerita kita tidak berakhir di sini.
              </h2>

              <p className="text-[14px] text-brand-muted mb-4 leading-relaxed">
                Bagaimana kalau ayahmu juga punya pesan yang tak terkirim?
              </p>

              <div className="w-full max-w-[280px] aspect-[4/5] mb-12 rounded-sm overflow-hidden mx-auto">
                <img
                  src="/images/ui/CS.png"
                  alt="Pesan Tak Terkirim"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-4">
                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() =>
                    window.open('https://linktr.ee/ayahparuhwaktu', '_blank')
                  }
                >
                  <span className="font-semibold tracking-[0.1em]">
                    LINKTREE
                  </span>
                  <span>→</span>
                </button>

                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() =>
                    window.open('https://www.tiktok.com/@ayahparuhwaktu', '_blank')
                  }
                >
                  <span className="font-semibold tracking-[0.1em]">
                    TIKTOK
                  </span>
                  <span>→</span>
                </button>

                <button
                  className="w-full border-thin border-brand-text px-8 py-4 text-[13px] hover:bg-brand-text hover:text-brand-bg transition-all duration-200 text-left flex justify-between items-center group"
                  onClick={() =>
                    window.open('https://instagram.com/ayahparuhwaktu', '_blank')
                  }
                >
                  <span className="font-semibold tracking-[0.1em]">
                    INSTAGRAM
                  </span>
                  <span>→</span>
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