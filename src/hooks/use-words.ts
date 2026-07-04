'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_ID } from '@/lib/constants';
import type { Word, WordFormData } from '@/types';

/** Hook for Words CRUD operations */
export function useWords() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('words')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setWords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch words');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWords]);

  const addWord = async (formData: WordFormData): Promise<Word | null> => {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    try {
      const { data, error: err } = await supabase
        .from('words')
        .insert({
          user_id: USER_ID,
          word: formData.word.trim(),
          pos: formData.pos || null,
          ipa: formData.ipa || null,
          meaning: formData.meaning.trim(),
          phrase: formData.phrase || null,
          example: formData.example || null,
          family: formData.family || null,
          topic: formData.topic || null,
          note: formData.note || null,
          source: formData.source || null,
        })
        .select()
        .single();

      if (err) throw err;
      setWords((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add word';
      if (message.includes('duplicate')) {
        throw new Error(`Từ "${formData.word}" đã tồn tại`);
      }
      throw new Error(message);
    }
  };

  const updateWord = async (
    id: string,
    formData: Partial<WordFormData>
  ): Promise<void> => {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    try {
      const { error: err } = await supabase
        .from('words')
        .update(formData)
        .eq('id', id);

      if (err) throw err;
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...formData } : w))
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update word'
      );
    }
  };

  const deleteWord = async (id: string): Promise<void> => {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    try {
      const { error: err } = await supabase
        .from('words')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete word'
      );
    }
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    const word = words.find((w) => w.id === id);
    if (!word) return;

    try {
      const { error: err } = await supabase
        .from('words')
        .update({ favorite: !word.favorite })
        .eq('id', id);

      if (err) throw err;
      setWords((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, favorite: !w.favorite } : w
        )
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to toggle favorite'
      );
    }
  };

  const bulkInsert = async (
    items: WordFormData[]
  ): Promise<{ success: number; failed: number }> => {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase chưa được cấu hình');

    let success = 0;
    let failed = 0;

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize).map((item) => ({
        user_id: USER_ID,
        word: item.word.trim(),
        pos: item.pos || null,
        ipa: item.ipa || null,
        meaning: item.meaning.trim(),
        phrase: item.phrase || null,
        example: item.example || null,
        family: item.family || null,
        topic: item.topic || null,
        note: item.note || null,
        source: item.source || null,
      }));

      const { data, error: err } = await supabase
        .from('words')
        .upsert(batch, { onConflict: 'user_id,word' })
        .select();

      if (err) {
        console.error('Supabase upsert error:', err);
        failed += batch.length;
      } else {
        success += data?.length || 0;
      }
    }

    await fetchWords(); // Refresh list
    return { success, failed };
  };

  return {
    words,
    loading,
    error,
    addWord,
    updateWord,
    deleteWord,
    toggleFavorite,
    bulkInsert,
    refetch: fetchWords,
  };
}
