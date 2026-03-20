import { Link } from 'react-router-dom'
import doctorImg from '../assets/Doctor.jpg'

export default function Homepage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex w-full items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sky-600 text-white grid place-items-center font-bold">E</div>
            <span className="text-2xl font-extrabold text-slate-900">EdgeMed Sync</span>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <Link className="hover:text-slate-900" to="/">Home</Link>
            <Link className="hover:text-slate-900" to="/auth/login">Chat 24/7</Link>
            <Link className="hover:text-slate-900" to="/auth/login">Urgent Care</Link>
            <Link className="hover:text-slate-900" to="/auth/login">Consultation</Link>
            <Link className="hover:text-slate-900" to="/auth/login">About</Link>
            <Link className="hover:text-slate-900" to="/auth/login">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/auth/register"
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700"
            >
              Sign Up
            </Link>
            <Link
              to="/auth/login"
              className="rounded-full border border-sky-600 px-5 py-2.5 text-sm font-semibold text-sky-600 bg-white/90 transition hover:bg-sky-50"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-indigo-50 p-10 shadow-2xl backdrop-blur-[0.5px] lg:grid-cols-2 min-h-[480px]">
          <div className="max-w-xl space-y-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Best Healthcare</p>
            <h2 className="text-5xl font-extrabold leading-tight !text-sky-800 sm:text-6xl">
              Online Doctors
              <br />
              A few Clicks away!
            </h2>
            <p className="mt-5 text-base text-slate-600 sm:text-lg">
              EdgeMed Sync provides a one-stop health solution. Reach experts via text, video, or phone; and manage all medical records securely.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/register"
                className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-700"
              >
                Get Started
              </Link>
              <Link
                to="/auth/login"
                className="rounded-full border border-sky-600 px-6 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="relative mx-auto max-w-md">
            <img src={doctorImg} alt="Doctor" className="h-full w-full rounded-3xl object-cover border border-slate-200 shadow-xl" />
            <div className="absolute bottom-2 right-2 rounded-xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
              <p className="text-xs font-semibold uppercase text-slate-500">Urgent Care</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Make Appointment</p>
            </div>
          </div>
        </section>

        <section className="mt-10 mx-auto w-full max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Medical specialties</p>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Expert care for every need</h3>
                        <p className="mt-4 text-sm text-slate-600 sm:text-base">Choose from a broad roster of vetted specialists, available instantly for telehealth consultation and treatment planning.</p>

          </div>

          <div className="mx-auto grid w-full max-w-6xl items-stretch grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Dermatology', detail: 'Skin, hair, and nail care', icon: 'medical_services' },
              { title: 'Chronic Care', detail: 'Asthma, diabetes, hypertension', icon: 'favorite' },
              { title: 'Gynecology', detail: 'Women’s health and fertility', icon: 'female' },
              { title: 'Urgent Care', detail: 'Fast triage and emergency follow-up', icon: 'local_hospital' },
            ].map((item) => (
              <div key={item.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <h4 className="text-xl font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
          <div className="mx-auto mb-6 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Why choose Edge-Med</p>
            <h3 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">Trusted care, instant access</h3>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              A modern telehealth solution built for patients, families, and practitioners who want reliability and security at every step.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Fast booking', value: 'Under 3 min', icon: 'schedule' },
              { label: 'Verified doctors', value: '1000+', icon: 'verified' },
              { label: 'Secure records', value: 'HIPAA-ready', icon: 'shield' },
              { label: '24/7 Help', value: 'Live support', icon: 'support' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-sky-50 p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-600">
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <div className="text-lg font-semibold text-slate-900">{item.value}</div>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>

        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Already a customer?</p>
          <Link to="/dashboard" className="mt-2 inline-block text-sm font-semibold text-sky-600 hover:text-sky-800">Go to your dashboard</Link>
        </section>
      </div>

      <footer className="mt-12 w-full bg-sky-800 text-white">
        <div className="mx-[calc((100vw-100%)/2)] w-screen flex flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
              <div className="text-center md:text-left">
                <div className="mb-2 flex items-center justify-center gap-3 md:justify-start">
                  <span className="material-symbols-outlined text-3xl">favorite</span>
                  <h3 className="text-2xl font-extrabold">EdgeMed Sync</h3>
                </div>
                <p className="text-sm text-white/80">EdgeMed Sync is a trademark of EdgeMed Healthcare Digital Services inc.</p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link to="/terms" className="hover:text-white/80">Terms Of Use</Link>
                <span className="text-white/50">•</span>
                <Link to="/privacy" className="hover:text-white/80">Privacy Policy</Link>
                <span className="text-white/50">•</span>
                <Link to="/about" className="hover:text-white/80">About Us</Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-white/90">
              <span>© {new Date().getFullYear()} EdgeMed Sync. All rights reserved</span>
              <div className="flex items-center gap-2">
                <a href="#" className="rounded-full bg-white/20 px-2 py-1 hover:bg-white/30">Facebook</a>
                <a href="#" className="rounded-full bg-white/20 px-2 py-1 hover:bg-white/30">Instagram</a>
                <a href="#" className="rounded-full bg-white/20 px-2 py-1 hover:bg-white/30">YouTube</a>
              </div>
            </div>
          </div>
        </footer>
    </main>
  )
}

