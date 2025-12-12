import { useState, useEffect } from "react";

export default function AuthLayout({ children, title, subtitle }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES = [
    {
      title: "Smart management for your financial future.",
      text: "Gain complete visibility over your expenses, set intelligent budgets, and achieve your saving goals with our modern tracking platform."
    },
    {
      title: "Track effortlessly, save more.",
      text: "Our intuitive interface makes logging expenses a breeze. Identify spending habits and find new ways to maximize your savings."
    },
    {
      title: "Visual insights at your fingertips.",
      text: "Beautiful charts and graphs give you an instant overview of your financial health. Make informed decisions with real-time data."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex flex-col justify-center gap-16 bg-gradient-to-br from-primary-600 to-accent-700 text-white p-12 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className="text-white drop-shadow-md">ExpenseTracker</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg min-h-[200px]">
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
            >
              <h2 className="text-4xl font-extrabold leading-tight mb-6">
                {slide.title}
              </h2>
              <p className="text-primary-100 text-lg leading-relaxed font-medium">
                {slide.text}
              </p>
            </div>
          ))}


        </div>


      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-2">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">ExpenseTracker</span>
          </div>

          <div className="text-center md:text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-dark-900">
              {title}
            </h1>
            <p className="mt-2 text-base text-dark-600">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}