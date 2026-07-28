// components/ApplicationForm.tsx

"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  APPLICATIONS,
  CONFERENCE,
  FORM,
  getApplicationQuestions,
  formatFormText,
} from '@/lib/conference';

// --- Interfaces ---
interface FormData {
  // Common / Personal
  fullName: string;
  email: string;
  phoneNumber: string;
  school: string;
  birthDate: string;
  nationalId: string;
  gender: string;
  grade: string;
  city: string;
  dietaryPreferences: string;
  additionalInfo: string;

  // Specific
  motivationLetter: string;
  experience: string;
  englishLevel: string; // Delegate
  committeePreferences: string[]; // Delegate
  camera: string; // Press

  // Delegation Specific (Main Contact)
  numberOfDelegates: number;

  // Chair Specific
  chairAnswer1?: string;
  chairAnswer2?: string;
  chairAnswer3?: string;
}

const COMMITTEES = FORM.committees;

const initialFormState: FormData = {
  fullName: '',
  birthDate: '',
  phoneNumber: '',
  email: '',
  nationalId: '',
  gender: '',
  school: '',
  grade: '',
  city: '',
  motivationLetter: '',
  experience: '',
  committeePreferences: Array(FORM.committeePreferenceCount).fill(''),
  additionalInfo: '',
  englishLevel: '',
  dietaryPreferences: '',
  camera: '',
  numberOfDelegates: FORM.minimumDelegates,
  chairAnswer1: '',
  chairAnswer2: '',
  chairAnswer3: ''
};

interface DelegateMember {
  fullName: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  gender: string;
  grade: string;
  city: string;
  motivationLetter: string;
  experience: string;
  committeePreferences: string[];
  additionalInfo: string;
  englishLevel: string;
  dietaryPreferences: string;
}

const ApplicationForm = ({
  applicationType
}: {
  applicationType: string;
}) => {
  const questions = getApplicationQuestions(applicationType);
  const storageKey = `${CONFERENCE.id}_form_${applicationType}`;
  const delegatesStorageKey = `${CONFERENCE.id}_form_delegates_${applicationType}`;
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [delegates, setDelegates] = useState<DelegateMember[]>([]);
  const [formsGenerated, setFormsGenerated] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [mainPageMessage, setMainPageMessage] = useState({
    text: '',
    isError: false
  });
  const [modalMessage, setModalMessage] = useState({
    text: '',
    isError: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle Portal Mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Local Storage Logic ---

  // 1. Load from Local Storage on Mount
  useEffect(() => {
    const savedData = localStorage.getItem(
      storageKey
    );
    const savedDelegates = localStorage.getItem(
      delegatesStorageKey
    );

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        // If delegation forms were previously generated, restore that state
        if (
          parsed.numberOfDelegates >= FORM.minimumDelegates &&
          applicationType === 'delegation'
        ) {
          setFormsGenerated(true);
        }
      } catch (e) {
        console.error("Failed to load saved form", e);
      }
    }

    if (savedDelegates && applicationType === 'delegation') {
      try {
        setDelegates(JSON.parse(savedDelegates));
        setFormsGenerated(true);
      } catch (e) {
        console.error("Failed to load saved delegates", e);
      }
    }

    setIsLoaded(true);
  }, [applicationType, delegatesStorageKey, storageKey]);

  // 2. Save to Local Storage on Change (Debounced)
  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => {
        localStorage.setItem(
          storageKey,
          JSON.stringify(formData)
        );
        if (applicationType === 'delegation' && delegates.length > 0) {
          localStorage.setItem(
            delegatesStorageKey,
            JSON.stringify(delegates)
          );
        }
      }, 500); // 500ms debounce
      return () => clearTimeout(timeout);
    }
  }, [formData, delegates, applicationType, isLoaded, delegatesStorageKey, storageKey]);

  // --- Handlers ---

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'numberOfDelegates' ? parseInt(value) || 0 : value
    }));
  };

  const handleCommitteeChange = (index: number, value: string) => {
    const newPreferences = [...formData.committeePreferences];
    newPreferences[index] = value;
    setFormData((prev) => ({
      ...prev,
      committeePreferences: newPreferences
    }));
  };

  const handleGenerateForms = () => {
    if (formData.numberOfDelegates < FORM.minimumDelegates) {
      setMainPageMessage({
        text: formatFormText(FORM.messages.minimumDelegates),
        isError: true
      });
      return;
    }

    // If we already have delegates in state (from localstorage), preserve them if count matches
    if (
      delegates.length === formData.numberOfDelegates &&
      formsGenerated
    ) {
      setFormsGenerated(true);
      setMainPageMessage({ text: '', isError: false });
      return;
    }

    const newDelegates = Array(formData.numberOfDelegates).fill({
      fullName: '',
      birthDate: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      gender: '',
      grade: '',
      city: '',
      motivationLetter: '',
      experience: '',
      committeePreferences: Array(FORM.committeePreferenceCount).fill(''),
      additionalInfo: '',
      englishLevel: '',
      dietaryPreferences: ''
    });

    setDelegates(newDelegates);
    setFormsGenerated(true);
    setMainPageMessage({ text: '', isError: false });
  };

  const handleDelegateMemberChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newDelegates = [...delegates];
    newDelegates[index] = { ...newDelegates[index], [field]: value };
    setDelegates(newDelegates);
  };

  const handleMemberCommitteeChange = (
    delegateIndex: number,
    prefIndex: number,
    value: string
  ) => {
    const newDelegates = [...delegates];
    const newPrefs = [
      ...newDelegates[delegateIndex].committeePreferences
    ];
    newPrefs[prefIndex] = value;
    newDelegates[delegateIndex] = {
      ...newDelegates[delegateIndex],
      committeePreferences: newPrefs
    };
    setDelegates(newDelegates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMainPageMessage({ text: '', isError: false }); // Clear main page message
    setModalMessage({ text: '', isError: false }); // Clear modal message

    // Explicit Chair Validation for Word Count
    // Word Count Validation
    if (applicationType !== 'delegation') {
      if (getWordCount(formData.motivationLetter) < FORM.minimumMotivationWords) {
        setMainPageMessage({
          text: formatFormText(FORM.messages.motivationTooShort),
          isError: true
        });
        setIsSubmitting(false);
        window.scrollTo(0, 0);
        return;
      }
    } else {
      // Validate all delegates
      for (let i = 0; i < delegates.length; i++) {
        if (getWordCount(delegates[i].motivationLetter) < FORM.minimumMotivationWords) {
          setMainPageMessage({
            text: formatFormText(FORM.messages.delegateMotivationTooShort, {
              number: i + 1,
            }),
            isError: true
          });
          setIsSubmitting(false);
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    const name =
      applicationType === 'delegation'
        ? formData.school
        : formData.fullName;

    const body = {
      email: formData.email,
      name: name,
      lang: 'en'
    };

    try {
      const response = await fetch(`/api/apply/${applicationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) {
        // If it's a specific error (like email_exists or rate limit), show it on main page
        if (response.status === 400 || response.status === 429) {
          setMainPageMessage({
            text: result.message || 'Error occurred',
            isError: true
          });
        } else {
          // Other errors might still go to modal or default error
          setModalMessage({
            text: result.message || 'Failed to submit application',
            isError: true
          });
        }
        throw new Error(result.message || 'Failed to submit');
      }
      setMainPageMessage({
        text: result.message,
        isError: false
      }); // Usually "Verification email sent"
      setVerificationModalOpen(true);
    } catch (error) {
      // If error already handled for main page, do nothing here.
      // Otherwise, set a generic error on main page.
      if (!mainPageMessage.text) {
        setMainPageMessage({
          text:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          isError: true
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage({ text: '', isError: false }); // Clear previous modal message

    let verificationBody: Record<string, unknown> = {
      code: verificationCode,
      lang: 'en',
      ...formData
    };

    if (applicationType === 'delegation') {
      verificationBody = {
        school: formData.school,
        email: formData.email,
        numberOfDelegates: formData.numberOfDelegates,
        delegates: delegates,
        code: verificationCode,
        lang: 'en'
      };
    }

    try {
      const response = await fetch(`/api/verify/${applicationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationBody)
      });
      const result = await response.json();
      if (!response.ok) {
        setModalMessage({
          text:
            result.message ||
            'Verification failed. Please check your code.',
          isError: true
        });
        throw new Error(result.message || 'Failed');
      }

      // Clear local storage on success
      localStorage.removeItem(storageKey);
      localStorage.removeItem(delegatesStorageKey);

      window.location.href = '/success';
    } catch {
      // Message already set in modalMessage state for display
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Parts ---

  const applicationTitle =
    APPLICATIONS.find((application) => application.id === applicationType)
      ?.formTitle ?? applicationType;

  const commonFields = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {applicationType === 'delegation'
            ? questions.schoolName
            : questions.fullName}
        </label>
        <input
          type="text"
          name={
            applicationType === 'delegation' ? 'school' : 'fullName'
          }
          value={
            applicationType === 'delegation'
              ? formData.school
              : formData.fullName
          }
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
          required
        />
      </div>

      {applicationType !== 'delegation' && (
        <>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.birthDate}
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.phoneNumber}
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {applicationType === 'delegation'
            ? questions.contactEmail
            : questions.email}
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
          required
        />
      </div>

      {applicationType !== 'delegation' && (
        <>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.nationalId}
            </label>
            <input
              type="text"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.gender}
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            >
              <option value="">{FORM.placeholders.selectGender}</option>
              {FORM.options.gender.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.school}
            </label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.grade}
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            >
              <option value="">{FORM.placeholders.selectGrade}</option>
              {FORM.options.grade.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {questions.city}
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
              required
            />
          </div>
        </>
      )}
    </div>
  );

  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const detailFields = (
    <div className="space-y-6">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {formatFormText(questions.motivationLetter)}
        </label>
        <textarea
          name="motivationLetter"
          value={formData.motivationLetter}
          onChange={handleInputChange}
          rows={5}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
          required
        />
        <p
          className={`text-sm mt-1 text-left ${
            getWordCount(formData.motivationLetter) >= FORM.minimumMotivationWords
              ? 'text-green-500'
              : 'text-red-500'
          }`}
        >
          {getWordCount(formData.motivationLetter)} / {FORM.minimumMotivationWords} words
        </p>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {questions.experience}
        </label>
        <textarea
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
        />
      </div>

      {(applicationType === 'delegate' || applicationType === 'chair') && (
        <>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {formatFormText(questions.committeePreferences)}
            </label>
            <div className="space-y-3">
              {Array.from({ length: FORM.committeePreferenceCount }, (_, idx) => idx).map((idx) => (
                <select
                  key={idx}
                  value={formData.committeePreferences[idx]}
                  onChange={(e) =>
                    handleCommitteeChange(idx, e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                  required={idx === 0}
                >
                  <option value="">
                    {formatFormText(questions.choice, { number: idx + 1 })}
                  </option>
                  {COMMITTEES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {applicationType === 'chair' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {questions.chairAnswer1}
                </label>
                <textarea
                  name="chairAnswer1"
                  value={formData.chairAnswer1}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {questions.chairAnswer3}
                </label>
                <textarea
                  name="chairAnswer3"
                  value={formData.chairAnswer3}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {questions.chairAnswer2}
                </label>
                <textarea
                  name="chairAnswer2"
                  value={formData.chairAnswer2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {questions.englishLevel}
              </label>
              <select
                name="englishLevel"
                value={formData.englishLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                required
              >
                <option value="">{FORM.placeholders.selectEnglishLevel}</option>
                {FORM.options.englishLevel.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {applicationType === 'press' && (
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {questions.camera}
          </label>
          <input
            name="camera"
            value={formData.camera}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
          />
        </div>
      )}

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {questions.dietaryPreferences}
        </label>
        <select
          name="dietaryPreferences"
          value={formData.dietaryPreferences}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
        >
          <option value="">{FORM.messages.selectNone}</option>
          {FORM.options.dietaryPreferences.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          {questions.additionalInfo}
        </label>
        <textarea
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 my-14 max-sm:my-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl max-sm:text-3xl mt-16 mb-16 max-sm:mt-8 text-center text-[var(--color-accent)] font-bold">
            {applicationTitle}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--color-accent)]">
              {applicationType === 'delegation'
                ? FORM.labels.delegationInformation
                : FORM.labels.personalInformation}
            </h2>
            {commonFields}

            {applicationType === 'delegation' && (
              <div className="mt-6">
                <label className="block text-white text-sm font-medium mb-2">
                  {formatFormText(questions.numberOfDelegates)}
                </label>
                <input
                  type="number"
                  name="numberOfDelegates"
                  value={formData.numberOfDelegates}
                  onChange={handleInputChange}
                  min={FORM.minimumDelegates}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateForms}
                  className="mt-4 px-6 py-3 bg-[var(--color-accent)] text-[var(--background)] font-bold rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  {FORM.labels.generateForms}
                </button>
              </div>
            )}
          </div>

          {applicationType !== 'delegation' && (
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-[var(--color-accent)]">
                {FORM.labels.applicationDetails}
              </h2>
              {detailFields}
            </div>
          )}

          {/* Delegation Loop */}
          {applicationType === 'delegation' && formsGenerated && (
            <div className="space-y-8">
              {delegates.map((d, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-xl p-8 shadow-xl border-l-4 border-[var(--color-accent)]"
                >
                  <h3 className="text-xl font-bold text-white mb-6">
                    {formatFormText(questions.delegate, { number: i + 1 })}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      placeholder={questions.delegateFullName}
                      value={d.fullName}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'fullName',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />
                    <input
                      placeholder={questions.delegateEmail}
                      type="email"
                      value={d.email}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'email',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />
                    <input
                      placeholder={questions.delegatePhoneNumber}
                      type="tel"
                      value={d.phoneNumber}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'phoneNumber',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />
                    <input
                      placeholder={questions.delegateNationalId}
                      value={d.nationalId}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'nationalId',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />
                    <input
                      placeholder={questions.delegateBirthDate}
                      type="date"
                      value={d.birthDate}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'birthDate',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />

                    <select
                      value={d.gender}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'gender',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    >
                      <option value="">{FORM.placeholders.selectGenderRequired}</option>
                      {FORM.options.gender.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={d.grade}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'grade',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    >
                      <option value="">{FORM.placeholders.selectGradeRequired}</option>
                      {FORM.options.grade.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder={questions.delegateCity}
                      value={d.city}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'city',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    />

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-white text-sm">
                        {questions.delegateCommitteePreferences}
                      </label>
                      {Array.from({ length: FORM.committeePreferenceCount }, (_, idx) => idx).map((idx) => (
                        <select
                          key={idx}
                          value={
                            d.committeePreferences[idx]
                          }
                          onChange={(e) =>
                            handleMemberCommitteeChange(
                              i,
                              idx,
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                          required={idx === 0}
                        >
                          <option value="">
                            {formatFormText(questions.choice, { number: idx + 1 })}
                          </option>
                          {COMMITTEES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                    <select
                      value={d.englishLevel}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'englishLevel',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      required
                    >
                      <option value="">{questions.delegateEnglishLevel}</option>
                      {FORM.options.englishLevel.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={d.dietaryPreferences}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'dietaryPreferences',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                    >
                      <option value="">{questions.delegateDietaryPreferences}</option>
                      {FORM.options.dietaryPreferences.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <div className="md:col-span-2">
                      <textarea
                        placeholder={questions.delegateExperience}
                        value={d.experience}
                        onChange={(e) =>
                          handleDelegateMemberChange(
                            i,
                            'experience',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white text-sm font-medium mb-1">
                        {formatFormText(questions.delegateMotivationLetter)}
                      </label>
                      <textarea
                        placeholder={questions.delegateMotivationLetterPlaceholder}
                        value={d.motivationLetter}
                        onChange={(e) =>
                          handleDelegateMemberChange(
                            i,
                            'motivationLetter',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                        rows={4}
                        required
                      />
                      <p
                        className={`text-sm mt-1 text-left ${
                          getWordCount(d.motivationLetter) >= FORM.minimumMotivationWords
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {getWordCount(d.motivationLetter)} / {FORM.minimumMotivationWords} words
                      </p>
                    </div>
                    <textarea
                      placeholder={questions.delegateAdditionalInfo}
                      value={d.additionalInfo}
                      onChange={(e) =>
                        handleDelegateMemberChange(
                          i,
                          'additionalInfo',
                          e.target.value
                        )
                      }
                      className="md:col-span-2 w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:border-[var(--color-accent)] transition-all"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {mainPageMessage.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                mainPageMessage.isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {mainPageMessage.text}
            </div>
          )}

          {(applicationType !== 'delegation' ||
            formsGenerated) && (
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group glassmorphism text-xl max-sm:text-base cursor-pointer items-center transition-all duration-300 justify-center gap-4 max-sm:gap-2 inline-flex backdrop-blur-md rounded-full px-8 py-4 max-sm:px-6 max-sm:py-3 shadow-lg ${
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isSubmitting
                  ? FORM.labels.submitting
                  : FORM.labels.submit}
                <svg
                  width="24"
                  height="19"
                  viewBox="0 0 24 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-300 group-hover:translate-x-2 max-sm:w-3.75"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.7105 0.439344C14.1953 1.02511 14.1953 1.97487 14.7105
                      2.56064L19.4951 7.99997H1.56946C0.840735 7.99997 0.25
                      8.67155 0.25 9.49997C0.25 10.3284 0.840735 11 1.56946
                      11H19.4951L14.7105 16.4392C14.1953 17.0251 14.1953
                      17.9749 14.7105 18.5606C15.2258 19.1465 16.0614 19.1465
                      16.5765 18.5606L23.6136 10.5606C24.1288 9.97473 24.1288
                      9.02509 23.6136 8.43932L16.5765 0.439344C16.0614
                      -0.146448 15.2258 -0.146448 14.7105 0.439344Z"
                    className="fill-white group-hover:fill-[var(--color-accent)] transition-colors duration-300"
                  />
                </svg>
              </button>
            </div>
          )}
        </form>

        {mounted && verificationModalOpen && createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[var(--background)] h-screen w-screen touch-none overscroll-none">
            <div className="bg-[var(--background)] border-2 border-[var(--color-accent)] p-8 rounded-3xl max-w-md w-[90%] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-3xl font-bold text-[var(--color-accent)] text-center">
                {FORM.labels.verifyEmail}
              </h2>
              <p className="text-gray-300 text-center">
                {FORM.messages.verificationSent}{' '}
                <span className="text-white font-semibold">
                  {formData.email}
                </span>
                .
              </p>

              {modalMessage.text && (
                <div
                  className={`mt-2 p-3 rounded-lg text-center ${
                    modalMessage.isError
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {modalMessage.text}
                </div>
              )}

              <form onSubmit={handleVerify} className="flex flex-col gap-4 mt-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white text-center text-2xl tracking-widest focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  placeholder={FORM.labels.verificationCodePlaceholder}
                  required
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                    className={`w-full px-4 py-4 cursor-pointer bg-[var(--color-accent)] text-[var(--background)] font-bold text-xl rounded-xl hover:bg-white transition-all active:scale-95 ${
                    isSubmitting ? 'opacity-70' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-5 w-5 border-2 border-[var(--background)] border-t-transparent rounded-full"></span>
                      {FORM.labels.verifying}
                    </span>
                  ) : (
                    FORM.labels.verifyCode
                  )}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default ApplicationForm;
