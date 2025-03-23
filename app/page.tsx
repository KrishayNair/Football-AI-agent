'use client';

import { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import styles from './page.module.css';

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
          <p>Analyzing the football match... This may take a moment.</p>
        </div>
      )}

      {analysis && (
        <div className={styles.analysisResult}>
          <h2>Match Analysis</h2>
          
          <div className={styles.analysisContent}>
            {parseAnalysis(analysis)}
          </div>
        </div>
      )}
    </main>
  );
}

function parseAnalysis(analysisText: string) {
  // Split the text into sections based on numbered points or headers
  const sections = analysisText.split(/(?=\d+\.\s|\n\n[A-Z][^a-z\n:]+:)/g);
  
  // Extract score if available
  const scoreRegex = /score(?:[^0-9]+)(\d+)[^0-9]+(\d+)|(\d+)[^0-9]+(\d+)(?:[^0-9]+)score/i;
  const scoreMatch = analysisText.match(scoreRegex);
  
  let homeTeam = '';
  let awayTeam = '';
  let homeScore = '';
  let awayScore = '';
  
  // Try to extract team names
  const teamsSection = sections.find(s => s.toLowerCase().includes('teams:') || s.toLowerCase().includes('1. teams'));
  if (teamsSection) {
    const teamsMatch = teamsSection.match(/teams[^a-z]+([A-Za-z\s]+)(?:vs\.?|versus|and|playing against)([A-Za-z\s]+)/i);
    if (teamsMatch) {
      homeTeam = teamsMatch[1].trim();
      awayTeam = teamsMatch[2].trim();
    }
  }
  
  // Extract scores if found
  if (scoreMatch) {
    if (scoreMatch[1] && scoreMatch[2]) {
      homeScore = scoreMatch[1];
      awayScore = scoreMatch[2];
    } else if (scoreMatch[3] && scoreMatch[4]) {
      homeScore = scoreMatch[3];
      awayScore = scoreMatch[4];
    }
  }
  
  // Determine who is winning
  let winningTeam = null;
  if (homeScore && awayScore) {
    if (parseInt(homeScore) > parseInt(awayScore)) {
      winningTeam = 'home';
    } else if (parseInt(homeScore) < parseInt(awayScore)) {
      winningTeam = 'away';
    }
  }
  
  return (
    <>
      {/* Show score panel if we have score information */}
      {(homeScore || awayScore) && (
        <div className={styles.scorePanel}>
          <div className={`${styles.scoreTeam} ${winningTeam === 'home' ? styles.winningTeam : ''}`}>
            {homeTeam || 'Home Team'}
          </div>
          <div className={styles.scoreValue}>{homeScore || '?'} - {awayScore || '?'}</div>
          <div className={`${styles.scoreTeam} ${winningTeam === 'away' ? styles.winningTeam : ''}`}>
            {awayTeam || 'Away Team'}
          </div>
        </div>
      )}
      
      <div className={styles.sectionsContainer}>
        {sections.map((section, index) => {
          // Check if this is a major section (starts with a number or has a title)
          const isMajorSection = /^\d+\.\s|^[A-Z][^a-z\n:]+:/.test(section.trim());
          
          // Extract the section title if possible
          let title = '';
          let content = section;
          
          if (isMajorSection) {
            const titleMatch = section.match(/^(\d+\.\s[^\n]+|[A-Z][^a-z\n:]+:)/);
            if (titleMatch) {
              title = titleMatch[0];
              content = section.substring(title.length).trim();
            }
          }
          
          // Handle bullet points
          const contentWithBullets = content.split('\n').map((line, lineIndex) => {
            if (line.trim().startsWith('- ')) {
              return (
                <li key={lineIndex} className={styles.bulletPoint}>
                  {line.trim().substring(2)}
                </li>
              );
            } else if (line.trim()) {
              return <p key={lineIndex}>{line.trim()}</p>;
            }
            return null;
          });
          
          // Filter out empty lines
          const filteredContent = contentWithBullets.filter(item => item !== null);
          
          // Create appropriate containers based on content type
          const hasBullets = filteredContent.some(item => item?.type === 'li');
          
          return (
            <div 
              key={index} 
              className={`${styles.analysisSection} ${isMajorSection ? styles.majorSection : ''}`}
            >
              {title && <h3 className={styles.sectionTitle}>{title}</h3>}
              
              {hasBullets ? (
                <ul className={styles.bulletList}>
                  {filteredContent}
                </ul>
              ) : (
                <div className={styles.paragraphContent}>
                  {filteredContent}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
} 