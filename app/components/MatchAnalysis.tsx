'use client'

import React, { useState, useEffect } from 'react'
import styles from '../page.module.css'

interface MatchAnalysisProps {
  analysis: string
}

export default function MatchAnalysis({ analysis }: MatchAnalysisProps) {
  const [parsedSections, setParsedSections] = useState<React.ReactNode | null>(null)
  
  useEffect(() => {
    if (analysis) {
      setParsedSections(parseAnalysis(analysis))
    }
  }, [analysis])
  
  return (
    <div className={styles.analysisResult}>
      <h2>Match Analysis</h2>
      <div className={styles.analysisContent}>
        {parsedSections}
      </div>
    </div>
  )
  
  // Function to parse and format the analysis
  function parseAnalysis(analysisText: string) {
    // Split the text into sections based on numbered points or headers
    const sections = analysisText.split(/(?=\d+\.\s|\n\n[A-Z][^a-z\n:]+:)/g)
    
    // Extract score if available
    const scoreRegex = /score(?:[^0-9]+)(\d+)[^0-9]+(\d+)|(\d+)[^0-9]+(\d+)(?:[^0-9]+)score/i
    const scoreMatch = analysisText.match(scoreRegex)
    
    let homeTeam = ''
    let awayTeam = ''
    let homeScore = ''
    let awayScore = ''
    
    // Try to extract team names
    const teamsSection = sections.find(s => 
      s.toLowerCase().includes('teams:') || 
      s.toLowerCase().includes('1. teams')
    )
    
    if (teamsSection) {
      const teamsMatch = teamsSection.match(
        /teams[^a-z]+([A-Za-z\s]+)(?:vs\.?|versus|and|playing against)([A-Za-z\s]+)/i
      )
      if (teamsMatch) {
        homeTeam = teamsMatch[1].trim()
        awayTeam = teamsMatch[2].trim()
      }
    }
    
    // Extract scores if found
    if (scoreMatch) {
      if (scoreMatch[1] && scoreMatch[2]) {
        homeScore = scoreMatch[1]
        awayScore = scoreMatch[2]
      } else if (scoreMatch[3] && scoreMatch[4]) {
        homeScore = scoreMatch[3]
        awayScore = scoreMatch[4]
      }
    }
    
    // Determine who is winning
    let winningTeam = null
    if (homeScore && awayScore) {
      if (parseInt(homeScore) > parseInt(awayScore)) {
        winningTeam = 'home'
      } else if (parseInt(homeScore) < parseInt(awayScore)) {
        winningTeam = 'away'
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
            const isMajorSection = /^\d+\.\s|^[A-Z][^a-z\n:]+:/.test(section.trim())
            
            // Extract the section title if possible
            let title = ''
            let content = section
            
            if (isMajorSection) {
              const titleMatch = section.match(/^(\d+\.\s[^\n]+|[A-Z][^a-z\n:]+:)/)
              if (titleMatch) {
                title = titleMatch[0]
                content = section.substring(title.length).trim()
              }
            }
            
            // Handle bullet points
            const contentWithBullets = content.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('- ')) {
                return (
                  <li key={lineIndex} className={styles.bulletPoint}>
                    {line.trim().substring(2)}
                  </li>
                )
              } else if (line.trim()) {
                return <p key={lineIndex}>{line.trim()}</p>
              }
              return null
            })
            
            // Filter out empty lines
            const filteredContent = contentWithBullets.filter(item => item !== null)
            
            // Create appropriate containers based on content type
            const hasBullets = filteredContent.some(item => item?.type === 'li')
            
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
            )
          })}
        </div>
      </>
    )
  }
} 