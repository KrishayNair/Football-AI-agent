'use client';

import { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import styles from './page.module.css';
import MatchAnalysis from './components/MatchAnalysis';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setAnalysis('');
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setVideoUrl(URL.createObjectURL(droppedFile));
      setAnalysis('');
      setError(null);
    }
  };

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const extractFrameFromVideo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadeddata = () => {
          video.currentTime = 1; // Skip to 1 second in
        };
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl.split(',')[1]); // Return base64 data without the prefix
        };
        
        video.onerror = () => {
          reject(new Error('Error loading video'));
        };
        
        video.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const analyzeVideo = async () => {
    if (!file) {
      setError('Please upload a video first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract a frame from the video
      const base64Frame = await extractFrameFromVideo(file);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: base64Frame,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (!data.analysis) {
        throw new Error('No analysis returned from the API');
      }

      setAnalysis(data.analysis[0].text);
    } catch (err: unknown) {
      console.error('Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Football Match Analysis AI</h1>
      
      <div 
        className={styles.uploadArea}
        onDrop={handleDrop}
        onDragOver={preventDefault}
        onDragEnter={preventDefault}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        
        {!videoUrl ? (
          <div className={styles.uploadPrompt}>
            <p>Drag and drop a football match video or</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadButton}
            >
              Select Video
            </button>
          </div>
        ) : (
          <div className={styles.videoPreview}>
            <ReactPlayer
              url={videoUrl}
              controls
              width="100%"
              height="auto"
            />
            <button 
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setAnalysis('');
              }}
              className={styles.clearButton}
            >
              Clear Video
            </button>
          </div>
        )}
      </div>

      {videoUrl && (
        <button 
          onClick={analyzeVideo}
          disabled={isLoading}
          className={styles.analyzeButton}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Match'}
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {isLoading && (
        <div className={styles.loadingIndicator}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing the football match... This may take a moment.</p>
        </div>
      )}

      {analysis && <MatchAnalysis analysis={analysis} />}
    </main>
  );
} 