// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import API from "../api";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await API.post("/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup failed:", error);
      setErrors({
        email: error.response?.data?.message || "Signup failed. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start tracking your expenses today"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Name Input */}
          <div className="group">
            <label htmlFor="name" className="block text-sm font-medium text-dark-700 mb-1 pl-1">Full Name</label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-dark-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none ${errors.name ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <div className="absolute right-3 top-3.5 text-red-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1.5 pl-1 font-medium">{errors.name}</p>}
          </div>

          {/* Email Input */}
          <div className="group">
            <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-1 pl-1">Email Address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-dark-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none ${errors.email ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <div className="absolute right-3 top-3.5 text-red-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1.5 pl-1 font-medium">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div className="group">
            <label htmlFor="password" className="block text-sm font-medium text-dark-700 mb-1 pl-1">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-dark-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none ${errors.password ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5 pl-1 font-medium">{errors.password}</p>}
          </div>

          {/* Confirm Password Input */}
          <div className="group">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-700 mb-1 pl-1">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-dark-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none ${errors.confirmPassword ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                  }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 pl-1 font-medium">{errors.confirmPassword}</p>}
          </div>

          {/* Custom Checkbox */}
          <div className="pt-0">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${formData.agreeTerms
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 bg-white group-hover:border-primary-400'
                  }`}>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${formData.agreeTerms ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-dark-600 text-sm leading-tight select-none">
                I agree to the{" "}
                <button type="button" className="text-primary-600 hover:text-primary-800 font-semibold hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-primary-600 hover:text-primary-800 font-semibold hover:underline">
                  Privacy Policy
                </button>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs mt-1.5 pl-8 font-medium">{errors.agreeTerms}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="text-center">
          <p className="text-dark-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-800 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}