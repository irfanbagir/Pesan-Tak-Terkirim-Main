import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

type Step = 'LANDING' | 'WRITE' | 'COLLECTION' | 'LOADING' | 'SUCCESS';

interface Submission {
  text: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('LANDING');
  const [formData, setFormData] = useState<Submission>({
    text: '',
    name: '',
    email: '',
    phone: '',
    countryCode: '+62',
  });

  const [selectedCard, setSelectedCard] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const PREDETERMINED_CARDS = [
    "/images/cards/card-01.png",
    "/images/cards/card-02.png",
    "/images/cards/card-03.png",
  ];

  const handleSubmit = async () => {
  setStep("LOADING");

  try {
    await fetch(
      "https://script.google.com/macros/s/AKfycbziFvnIyZLrW_REAO6t4fYPEsz5vyHiPgU1T6d05DpVBaeZWYAHY9c7Zlr1TVax9lzAvw/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          text: formData.text,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode,
          createdAt: new Date().toISOString(),
        }),
      }
    );
  } catch (err) {
    console.error("Submit error:", err);
  }

  const random =
    PREDETERMINED_CARDS[
      Math.floor(Math.random() * PREDETERMINED_CARDS.length)
    ];

  setSelectedCard(random);

  setTimeout(() => {
    setStep("SUCCESS");
  }, 2000);
};

  const handleDownload = async () => {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current);
    const link = document.createElement("a");
    link.download = "card.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <AnimatePresence mode="wait">

        {step === 'LANDING' && (
          <motion.div key="landing">
            <h1>Pesan Tak Terkirim</h1>
            <button onClick={() => setStep('WRITE')}>Mulai</button>
          </motion.div>
        )}

        {step === 'WRITE' && (
          <motion.div key="write">
            <textarea
              placeholder="Tulis pesan..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            />
            <button onClick={() => setStep('COLLECTION')}>Lanjut</button>
          </motion.div>
        )}

        {step === 'COLLECTION' && (
          <motion.div key="form">
            <input
              placeholder="Nama"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <button onClick={handleSubmit}>Kirim</button>
          </motion.div>
        )}

        {step === 'LOADING' && (
          <motion.div key="loading">
            <p>Loading...</p>
          </motion.div>
        )}

        {step === 'SUCCESS' && (
          <motion.div key="success">
            <h2>Berhasil!</h2>

            <div ref={cardRef}>
              <img src={selectedCard} alt="card" />
            </div>

            <button onClick={handleDownload}>Download</button>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}