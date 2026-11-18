'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StorefrontContent, DEFAULT_STOREFRONT_CONTENT } from '@/lib/content/defaults';

interface StorefrontContentContextType {
  content: StorefrontContent;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  updateField: (path: string, value: string) => void;
  updateSection: (section: keyof StorefrontContent, data: any) => void;
  saveChanges: () => Promise<boolean>;
  resetChanges: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveMessage: { text: string; type: 'success' | 'error' } | null;
  clearSaveMessage: () => void;
}

const StorefrontContentContext = createContext<StorefrontContentContextType | undefined>(undefined);

function EditQueryWatcher({ onDetect }: { onDetect: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('edit') === 'true' || searchParams?.get('editor') === '1') {
      onDetect();
    }
  }, [searchParams, onDetect]);
  return null;
}

export function StorefrontContentProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode;
  initialContent: StorefrontContent;
}) {
  const [content, setContent] = useState<StorefrontContent>(initialContent || DEFAULT_STOREFRONT_CONTENT);
  const [savedBaseline, setSavedBaseline] = useState<StorefrontContent>(initialContent || DEFAULT_STOREFRONT_CONTENT);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleEditDetect = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Update a nested path such as "hero.title" or "storySection.shippingText"
  const updateField = useCallback((path: string, value: string) => {
    setContent((prev) => {
      const parts = path.split('.');
      if (parts.length === 1 && parts[0]) {
        return { ...prev, [parts[0]]: value };
      }
      if (parts.length === 2 && parts[0] && parts[1]) {
        const sec = parts[0] as keyof StorefrontContent;
        const key = parts[1];
        return {
          ...prev,
          [sec]: {
            ...((prev[sec] as any) || {}),
            [key]: value,
          },
        };
      }
      return prev;
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateSection = useCallback((section: keyof StorefrontContent, data: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        ...data,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save changes');
      }

      setSavedBaseline(content);
      setHasUnsavedChanges(false);
      setSaveMessage({
        text: '✨ Webpage updated! Changes saved to codebase.',
        type: 'success',
      });

      // Auto dismiss message after 4.5 seconds
      setTimeout(() => {
        setSaveMessage((msg) => (msg?.type === 'success' ? null : msg));
      }, 4500);

      return true;
    } catch (err: any) {
      console.error('Error saving storefront content:', err);
      setSaveMessage({
        text: `Error: ${err.message || 'Could not save changes to codebase'}`,
        type: 'error',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  const resetChanges = useCallback(() => {
    setContent(savedBaseline);
    setHasUnsavedChanges(false);
    setSaveMessage({
      text: 'Changes reset to last saved copy.',
      type: 'success',
    });
    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  }, [savedBaseline]);

  const clearSaveMessage = useCallback(() => {
    setSaveMessage(null);
  }, []);

  return (
    <StorefrontContentContext.Provider
      value={{
        content,
        isEditing,
        setIsEditing,
        updateField,
        updateSection,
        saveChanges,
        resetChanges,
        isSaving,
        hasUnsavedChanges,
        saveMessage,
        clearSaveMessage,
      }}
    >
      <Suspense fallback={null}>
        <EditQueryWatcher onDetect={handleEditDetect} />
      </Suspense>
      {children}
    </StorefrontContentContext.Provider>
  );
}

export function useStorefrontContent() {
  const context = useContext(StorefrontContentContext);
  if (!context) {
    return {
      content: DEFAULT_STOREFRONT_CONTENT,
      isEditing: false,
      setIsEditing: () => {},
      updateField: () => {},
      updateSection: () => {},
      saveChanges: async () => false,
      resetChanges: () => {},
      isSaving: false,
      hasUnsavedChanges: false,
      saveMessage: null,
      clearSaveMessage: () => {},
    };
  }
  return context;
}
