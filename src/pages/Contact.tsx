import { Suspense, lazy, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { LiquidText } from '../components/LiquidText';
import { useLang } from '../i18n/LanguageContext';
import './Contact.css';

const ParticleSphere = lazy(() => import('../components/ParticleSphere'));

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  value: string;
  onChange: (name: string, value: string) => void;
}

function Field({ label, name, type = 'text', textarea, required, value, onChange }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  const shared = {
    id: name,
    name,
    value,
    required,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, e.target.value),
  };

  return (
    <div className={`field ${textarea ? 'field-textarea' : ''}`}>
      <motion.label
        htmlFor={name}
        className="field-label"
        animate={{
          y: floated ? -24 : 0,
          scale: floated ? 0.72 : 1,
          // contrast pass: resting labels were 0.55 (illegible in bright light)
          opacity: floated ? 1 : 0.82,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {label}
      </motion.label>
      {textarea ? <textarea rows={4} {...shared} /> : <input type={type} {...shared} />}
      <span className="field-underline" data-focused={focused} aria-hidden="true" />
    </div>
  );
}

const INITIAL = { name: '', email: '', company: '', message: '' };

export function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [sent, setSent] = useState(false);
  const { dict } = useLang();

  const update = (name: string, value: string) => setForm((f) => ({ ...f, [name]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // no backend yet — Phase 4 wires this up
    console.log('Contact form submission:', form);
    setSent(true);
  };

  return (
    <PageShell className="page contact">
      <Seo title="Get in Touch — Lyken Agency" path="/contact" />
      <header className="page-head contact-head">
        <span className="section-label">{dict.contact.label}</span>
        <LiquidText as="h1" className="page-headline contact-headline">
          Lorem ipsum dolor sit amet.
        </LiquidText>
      </header>

      <div className="contact-cols">
        <form className="contact-form" onSubmit={submit} noValidate={false}>
          <Field label={dict.contact.name} name="name" required value={form.name} onChange={update} />
          <Field label={dict.contact.email} name="email" type="email" required value={form.email} onChange={update} />
          <Field label={dict.contact.company} name="company" value={form.company} onChange={update} />
          <Field label={dict.contact.message} name="message" textarea required value={form.message} onChange={update} />

          <div className="contact-submit-row" aria-live="polite">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.p
                  key="success"
                  className="contact-success"
                  role="status"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {dict.contact.success}
                </motion.p>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  className="btn-ghost"
                  data-magnetic
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  {dict.contact.send}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>

        <aside className="contact-aside" aria-label={dict.contact.asideLabel}>
          <div className="contact-details">
            <a href="mailto:hello@lyken.agency" className="contact-email" data-magnetic>
              hello@lyken.agency
            </a>
            <p className="contact-location u-label">Lorem Ipsum Street 12 · Dolor City</p>
            <div className="contact-social">
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" data-magnetic>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 10v7M8 7v.5M12 17v-4a2.5 2.5 0 0 1 5 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" data-magnetic>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17" cy="7" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          {/* decorative particle sphere — proper visual anchor for the column
              (radius +43% over the old 1.15 accent size) */}
          <div className="contact-figure" aria-hidden="true">
            <Suspense fallback={null}>
              <ParticleSphere count={2200} radius={1.65} />
            </Suspense>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
