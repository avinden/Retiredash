'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { PdfExtraction } from '@/types';

interface PdfUploadProps {
  onExtracted: (extraction: PdfExtraction) => void;
}

const MAX_SIZE = 10 * 1024 * 1024;

export function PdfUpload({ onExtracted }: PdfUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are accepted';
    }
    if (file.size > MAX_SIZE) {
      return `File exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (file.size === 0) return 'File is empty';
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError('');
      setUploading(true);
      setProgress(30);

      try {
        const formData = new FormData();
        formData.append('file', file);
        setProgress(60);

        const res = await fetch('/api/imports/upload', {
          method: 'POST',
          body: formData,
        });

        setProgress(90);

        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const msg =
            data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof (data as Record<string, unknown>).error === 'string'
              ? (data as Record<string, string>).error
              : `Upload failed (${res.status})`;
          throw new Error(msg);
        }

        const extraction: PdfExtraction = await res.json();
        setProgress(100);
        onExtracted(extraction);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [validateFile, onExtracted],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Statement</CardTitle>
        <CardDescription>
          Upload a PDF statement to extract account data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <p className="mb-4 text-sm text-muted-foreground">
            Drag and drop a PDF here, or
          </p>
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            PDF only, max 10MB
          </p>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Processing...
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
