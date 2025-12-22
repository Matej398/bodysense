import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import './App.css'

function App() {
  // Default positions for each exercise (used when no saved positions exist)
  const exerciseDefaultPositions = {
    0: { // Exercise 1
      1: { top: 62.76662484316186, right: 48.71394230769231 },
      2: { top: 54.50321518193224, right: 50.38461538461539 },
      3: { top: 47.06320577164366, right: 52.69230769230769 },
      4: { top: 47.04360100376411, right: 38.46153846153847 },
      5: { top: 55.55795169385195, right: 32.09535256410256 }
    },
    1: { // Exercise 2
      1: { top: 49.466750313676286, right: 28.713942307692307 },
      2: { top: 42.8344573400251, right: 24.23076923076923 },
      3: { top: 36.5236825595985, right: 22.17948717948718 },
      4: { top: 31.35978670012547, right: 12.051282051282051 },
      5: { top: 36.48643350062735, right: 6.454326923076923 }
    },
    2: { // Exercise 3
      1: { top: 54.98745294855709, right: 45.89342948717949 },
      2: { top: 48.355159974905895, right: 52.94871794871795 },
      3: { top: 41.291562107904646, right: 55.00000000000001 },
      4: { top: 42.526662484316184, right: 40.76923076923077 },
      5: { top: 48.53160288582183, right: 40.55689102564102 }
    }
  }
  
  // Fallback default positions (if exercise index doesn't exist)
  const defaultPositions = exerciseDefaultPositions[0]

  // Exercises data structure
  const exercises = [
    {
      name: 'Exercise 1',
      title: 'Shoulder Warmup Routine',
      images: [
        { side: 'front', path: '/woman-image.png' },
        { side: 'back', path: '/woman-2.png' }
      ],
      totalSteps: 5
    },
    {
      name: 'Exercise 2',
      title: 'Knee Pain Massage',
      images: [
        { side: 'front', path: '/woman-2.png' },
        { side: 'back', path: '/woman-3.png' }
      ],
      totalSteps: 5
    },
    {
      name: 'Exercise 3',
      title: 'Back Pain',
      images: [
        { side: 'front', path: '/woman-3.png' }
      ],
      totalSteps: 3
    }
  ]

  // Load current exercise index and image side from localStorage or default to 0
  const savedExerciseIndex = typeof window !== 'undefined' ? localStorage.getItem('currentExerciseIndex') : null
  const initialExerciseIndex = savedExerciseIndex ? parseInt(savedExerciseIndex, 10) : 0
  
  const savedImageSide = typeof window !== 'undefined' ? localStorage.getItem(`currentImageSide_exercise_${initialExerciseIndex}`) : null
  const initialImageSide = savedImageSide ? parseInt(savedImageSide, 10) : 0
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(initialExerciseIndex)
  const [currentImageSide, setCurrentImageSide] = useState(initialImageSide)
  const currentExercise = exercises[currentExerciseIndex] || exercises[0]
  const currentImage = currentExercise?.images?.[currentImageSide] || currentExercise?.images?.[0] || { side: 'front', path: '/woman-image.png' }
  
  // Update getInitialPositions to use exercise index and image side
  // Saved positions become the default for each exercise/image side combination
  const getInitialPositionsForExercise = (exerciseIndex, imageSide) => {
    // First, try to load saved positions for this specific exercise/image side
    const saved = localStorage.getItem(`circlePositions_exercise_${exerciseIndex}_side_${imageSide}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate that we have all 5 positions
        if (parsed && Object.keys(parsed).length === 5) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse saved positions:', e)
      }
    }
    // If no saved positions for this exercise, use exercise-specific defaults
    const exerciseDefaults = exerciseDefaultPositions[exerciseIndex]
    if (exerciseDefaults) {
      return exerciseDefaults
    }
    // Fallback to Exercise 1 defaults if exercise index doesn't exist
    return defaultPositions
  }
  
  const [overlayPositions, setOverlayPositions] = useState(() => 
    getInitialPositionsForExercise(initialExerciseIndex, initialImageSide)
  )

  // Save positions to localStorage whenever they change (so they become the default)
  useEffect(() => {
    if (typeof window !== 'undefined' && overlayPositions) {
      // Save positions as default for current exercise and image side
      localStorage.setItem(
        `circlePositions_exercise_${currentExerciseIndex}_side_${currentImageSide}`,
        JSON.stringify(overlayPositions)
      )
      // Also save as default positions (used for new exercises that don't have saved positions)
      localStorage.setItem(
        'circlePositions_default',
        JSON.stringify(overlayPositions)
      )
    }
  }, [overlayPositions, currentExerciseIndex, currentImageSide])

  const [currentCircle, setCurrentCircle] = useState(1)
  const [step, setStep] = useState('idle') // idle, sealing, starting, massaging, releasing, autoStarting
  
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [timeRemainingPrecise, setTimeRemainingPrecise] = useState(10)
  const [autoStartCountdown, setAutoStartCountdown] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [showProgressAndTimer, setShowProgressAndTimer] = useState(false)
  const [sealingProgress, setSealingProgress] = useState(0)
  const [releasingProgress, setReleasingProgress] = useState(0)
  const [pausedProgress, setPausedProgress] = useState(0)
  const [showMassageInProgress, setShowMassageInProgress] = useState(false)
  const [showReleasingShortly, setShowReleasingShortly] = useState(false)
  
  const timerRef = useRef(null)
  const sealingTimerRef = useRef(null)
  const releasingTimerRef = useRef(null)
  const autoStartTimerRef = useRef(null)
  const massagingStartTimeRef = useRef(null)
  const pausedDurationRef = useRef(0)

  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previousStep, setPreviousStep] = useState('idle')
  const [hasAnimated, setHasAnimated] = useState(false)
  
  // Load menu state from localStorage or default to false
  const savedMenuState = typeof window !== 'undefined' ? localStorage.getItem('menuOpen') : null
  const initialMenuState = savedMenuState ? savedMenuState === 'true' : false
  const [isMenuOpen, setIsMenuOpen] = useState(initialMenuState)
  
  // Save menu state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuOpen', isMenuOpen.toString())
    }
  }, [isMenuOpen])

  // Sealing animation (5 seconds)
  useEffect(() => {
    if (step === 'sealing') {
      setSealingProgress(0)
      const duration = 5000 // 5 seconds
      const interval = 50 // Update every 50ms
      let progress = 0
      
      sealingTimerRef.current = setInterval(() => {
        progress += interval
        setSealingProgress((progress / duration) * 100)
        
        if (progress >= duration) {
          clearInterval(sealingTimerRef.current)
          setStep('starting')
          // Reset timer - don't start counting yet
          setTimeRemaining(10)
          setTimeRemainingPrecise(10)
          setIsPaused(false)
          massagingStartTimeRef.current = null
          pausedDurationRef.current = 0
          setShowMassageInProgress(false)
          setShowReleasingShortly(false)
          setShowProgressAndTimer(true) // Show timer immediately with "Starting hybrid massage"
          
          // After 2 seconds, change to "Hybrid Massage in progress" and start progress + timer
          setTimeout(() => {
            setShowMassageInProgress(true)
            setStep('massaging')
            // Initialize timer start time when massaging begins
            massagingStartTimeRef.current = Date.now()
          }, 2000)
        }
      }, interval)
      
      return () => {
        if (sealingTimerRef.current) {
          clearInterval(sealingTimerRef.current)
        }
      }
    }
  }, [step])

  // Countdown timer - smooth animation (starts only during "massaging" step)
  useEffect(() => {
    if (step === 'massaging' && !isPaused) {
      // Initialize start time if not set (only when massaging begins)
      if (!massagingStartTimeRef.current) {
        // Calculate how much time has already elapsed
        const alreadyElapsed = (10 - timeRemainingPrecise) * 1000
        massagingStartTimeRef.current = Date.now() - alreadyElapsed
      }
      
      const updateTimer = () => {
        const now = Date.now()
        const elapsed = now - massagingStartTimeRef.current
        const remaining = Math.max(0, (10 * 1000) - elapsed)
        const remainingSeconds = remaining / 1000
        
        setTimeRemainingPrecise(remainingSeconds)
        setTimeRemaining(Math.ceil(remainingSeconds))
        
        // Show "releasing shortly" text when 2 seconds remain (just text change, no step change)
        if (remainingSeconds <= 2 && remainingSeconds > 1.5) {
          setShowReleasingShortly(true)
        }
        
        if (remaining <= 0) {
          clearInterval(timerRef.current)
          setTimeRemainingPrecise(0)
          setTimeRemaining(0)
          // Small delay to ensure progress bar reaches 100% before step change
          setTimeout(() => {
            massagingStartTimeRef.current = null
            pausedDurationRef.current = 0
            setStep('releasing')
          }, 150)
        }
      }
      
      timerRef.current = setInterval(updateTimer, 50) // Update every 50ms for smooth animation
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    } else if (step === 'massaging' && isPaused) {
      // Save current progress when paused
      setPausedProgress(timeRemainingPrecise)
      // Clear timer when paused
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Reset the start time reference so it recalculates on resume
      if (massagingStartTimeRef.current) {
        massagingStartTimeRef.current = null
      }
    } else if (step !== 'starting' && step !== 'massaging') {
      // Reset when leaving massaging step
      massagingStartTimeRef.current = null
      pausedDurationRef.current = 0
      setShowReleasingShortly(false)
      setShowProgressAndTimer(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [step, isPaused])

  // Releasing animation (3 seconds)
  useEffect(() => {
    if (step === 'releasing') {
      // Start from 100% - button is already full from massage
      setReleasingProgress(100)
      const duration = 3000 // 3 seconds
      const interval = 50 // Update every 50ms
      let elapsed = 0
      
      // Small delay to ensure smooth transition
      const releaseTimeout = setTimeout(() => {
        releasingTimerRef.current = setInterval(() => {
          elapsed += interval
          const progress = Math.max(0, 100 - (elapsed / duration) * 100) // Decrease from 100% to 0%
          setReleasingProgress(progress)
          
          if (elapsed >= duration || progress <= 0) {
            clearInterval(releasingTimerRef.current)
            // Auto-advance to next circle after releasing
            if (currentCircle < 5) {
              // Smoothly transition to next circle with animation
              setTimeout(() => {
                setCurrentCircle(prev => prev + 1)
                setStep('autoStarting')
                setAutoStartCountdown(5)
              }, 100) // Small delay to allow circle transition animation
            } else {
              // Exercise complete
              setStep('complete')
            }
          }
        }, interval)
      }, 50) // Small delay to ensure button is full before starting release
      
      return () => {
        if (releasingTimerRef.current) {
          clearInterval(releasingTimerRef.current)
        }
        clearTimeout(releaseTimeout)
      }
    }
  }, [step, currentCircle])

  // Auto-starting countdown (5 seconds)
  useEffect(() => {
    if (step === 'autoStarting') {
      autoStartTimerRef.current = setInterval(() => {
        setAutoStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(autoStartTimerRef.current)
            // Automatically start sealing
            setStep('sealing')
            setSealingProgress(0)
            setTimeRemaining(10)
            setTimeRemainingPrecise(10)
            setIsPaused(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (autoStartTimerRef.current) {
          clearInterval(autoStartTimerRef.current)
        }
      }
    }
  }, [step])

  const handleStart = () => {
    if (step === 'idle') {
      setStep('sealing')
    } else if (step === 'massaging') {
      if (isPaused) {
        // Resume from current time
        setIsPaused(false)
      } else {
        // Pause - save current progress before setting paused state
        setPausedProgress(timeRemainingPrecise)
        setIsPaused(true)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatStep = (step) => {
    const stepMap = {
      'idle': 'Idle',
      'sealing': 'Applicator Sealing',
      'starting': 'Starting Hybrid Massage',
      'massaging': 'Hybrid Massage in Progress',
      'releasing': 'Applicator Releasing',
      'autoStarting': 'Auto Starting',
      'complete': 'Complete'
    }
    return stepMap[step] || step
  }

  const getInstructionText = () => {
    switch (step) {
      case 'idle':
        return (
          <>
            Place applicator on{' '}
            <span className="instruction-circle"></span>
            <br />
            and press Start
          </>
        )
      case 'sealing':
        return 'Applicator sealing'
      case 'starting':
        return 'Starting Hybrid Massage'
      case 'massaging':
        if (showReleasingShortly) {
          return 'Applicator releasing shortly...'
        }
        return showMassageInProgress ? 'Hybrid Massage in progress' : 'Starting Hybrid Massage'
      case 'releasing':
        return 'Applicator releasing'
      case 'autoStarting':
        return (
          <>
            Place applicator on{' '}
            <span className="instruction-circle"></span>
            <br />
            <span className="auto-starting-text">Auto starting</span>
          </>
        )
      case 'complete':
        return 'Exercise complete!'
      default:
        return ''
    }
  }

  const getButtonText = () => {
    if (step === 'idle') {
      return 'Start'
    } else if (step === 'sealing') {
      return 'Sealing...'
    } else if (step === 'starting' || step === 'massaging') {
      // This won't be used for massaging anymore, but keep for starting
      return formatTime(timeRemaining)
    } else if (step === 'releasing') {
      return formatTime(timeRemaining)
    } else if (step === 'autoStarting') {
      return formatTime(autoStartCountdown)
    } else {
      return 'Start'
    }
  }

  const handleMouseDown = (e, overlayNum) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    
    setDragging(overlayNum)
    setDragOffset({
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2)
    })
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    
    const container = document.querySelector('.image-container')
    if (!container) return
    
    const containerRect = container.getBoundingClientRect()
    // Calculate position so circle center is at mouse cursor
    const x = e.clientX - containerRect.left - dragOffset.x
    const y = e.clientY - containerRect.top - dragOffset.y
    
    const rightPercent = ((containerRect.width - x) / containerRect.width) * 100
    const topPercent = (y / containerRect.height) * 100

    setOverlayPositions(prev => {
      const newPositions = {
        ...prev,
        [dragging]: {
          top: Math.max(0, Math.min(100, topPercent)),
          right: Math.max(0, Math.min(100, rightPercent))
        }
      }
      // Save to localStorage immediately for current exercise and image side
      localStorage.setItem(
        `circlePositions_exercise_${currentExerciseIndex}_side_${currentImageSide}`, 
        JSON.stringify(newPositions)
      )
      return newPositions
    })
  }

  const handleMouseUp = () => {
    if (dragging) {
      // Log current positions for saving
      console.log('Current circle positions:')
      console.log(JSON.stringify(overlayPositions, null, 2))
    }
    setDragging(null)
  }

  // Helper function to export current positions - accessible via window.exportPositions()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.exportPositions = () => {
        const allPositions = {}
        exercises.forEach((exercise, exerciseIndex) => {
          exercise.images.forEach((image, imageSide) => {
            const key = `circlePositions_exercise_${exerciseIndex}_side_${imageSide}`
            const saved = localStorage.getItem(key)
            if (saved) {
              allPositions[key] = JSON.parse(saved)
            }
          })
        })
        const defaultSaved = localStorage.getItem('circlePositions_default')
        if (defaultSaved) {
          allPositions.default = JSON.parse(defaultSaved)
        }
        console.log('All saved positions:')
        console.log(JSON.stringify(allPositions, null, 2))
        console.log('\nCurrent positions (copy this to update defaultPositions):')
        console.log(JSON.stringify(overlayPositions, null, 2))
        return overlayPositions
      }
    }
  }, [overlayPositions])

  const handleChangeExercise = () => {
    // Save current positions for current exercise and image side before switching
    localStorage.setItem(
      `circlePositions_exercise_${currentExerciseIndex}_side_${currentImageSide}`, 
      JSON.stringify(overlayPositions)
    )
    
    // Switch to next exercise
    const nextIndex = (currentExerciseIndex + 1) % exercises.length
    localStorage.setItem('currentExerciseIndex', nextIndex.toString())
    
    // Reset to first image side for new exercise
    localStorage.setItem(`currentImageSide_exercise_${nextIndex}`, '0')
    
    // Reload the page to trigger full screen animation and load new positions
    window.location.reload()
  }

  const handleRotateImage = () => {
    if (currentExercise.images.length <= 1) return // No rotation if only one image
    
    // Save current positions for current exercise and image side before switching
    localStorage.setItem(
      `circlePositions_exercise_${currentExerciseIndex}_side_${currentImageSide}`, 
      JSON.stringify(overlayPositions)
    )
    
    // Switch to next image side
    const nextSide = (currentImageSide + 1) % currentExercise.images.length
    setCurrentImageSide(nextSide)
    localStorage.setItem(`currentImageSide_exercise_${currentExerciseIndex}`, nextSide.toString())
    
    // Load positions for the new image side
    const newPositions = getInitialPositionsForExercise(currentExerciseIndex, nextSide)
    setOverlayPositions(newPositions)
    
    // Reset animation state to trigger reveal
    setHasAnimated(false)
    setTimeout(() => setHasAnimated(true), 100)
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, dragOffset, handleMouseMove, handleMouseUp])

  // Initialize default positions for each exercise on first load (if not already saved)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      exercises.forEach((exercise, exerciseIndex) => {
        exercise.images.forEach((image, imageSide) => {
          const key = `circlePositions_exercise_${exerciseIndex}_side_${imageSide}`
          const saved = localStorage.getItem(key)
          if (!saved && exerciseDefaultPositions[exerciseIndex]) {
            // Save exercise-specific defaults if no saved positions exist
            localStorage.setItem(key, JSON.stringify(exerciseDefaultPositions[exerciseIndex]))
          }
        })
      })
      // Also save Exercise 1 positions as the general default
      if (!localStorage.getItem('circlePositions_default') && exerciseDefaultPositions[0]) {
        localStorage.setItem('circlePositions_default', JSON.stringify(exerciseDefaultPositions[0]))
      }
    }
  }, [])

  // Trigger initial reveal animation on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.animationStartTime = Date.now()
    }
    const timer = setTimeout(() => {
      setHasAnimated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])


  return (
    <div className="app-wrapper">
      {/* Menu Toggle Button - Hidden when menu is open */}
      {!isMenuOpen && (
        <button 
          className="menu-toggle-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}
      
      {/* Dashboard / Left Menu */}
      <motion.div 
        className="dashboard"
        initial={false}
        animate={{ 
          x: isMenuOpen ? 0 : -360,
          opacity: isMenuOpen ? 1 : 0
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <div className="dashboard-content" style={{ opacity: isMenuOpen ? 1 : 0, pointerEvents: isMenuOpen ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}>
          <h2>{currentExercise.name}</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>{currentExercise.title}</p>
          
          <div className="dashboard-section">
            <h3>Status</h3>
            <div className="dashboard-item">
              <span className="dashboard-label">Current Step:</span>
              <span className="dashboard-value">{formatStep(step)}</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-label">Active Circle:</span>
              <span className="dashboard-value">{currentCircle}</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-label">Paused:</span>
              <span className="dashboard-value">{isPaused ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Timer</h3>
            <div className="dashboard-item">
              <span className="dashboard-label">Time Remaining:</span>
              <span className="dashboard-value">{formatTime(timeRemaining)}</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-label">Auto Start:</span>
              <span className="dashboard-value">{autoStartCountdown}</span>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Progress</h3>
            <div className="dashboard-item">
              <span className="dashboard-label">Sealing:</span>
              <span className="dashboard-value">{Math.round(sealingProgress)}%</span>
            </div>
            <div className="dashboard-item">
              <span className="dashboard-label">Releasing:</span>
              <span className="dashboard-value">{Math.round(releasingProgress)}%</span>
            </div>
          </div>
          
        <div className="dashboard-section">
          <h3>Settings</h3>
          <button 
            className="dashboard-change-image-button" 
            onClick={handleChangeExercise}
          >
            Change Exercise
          </button>
          <button className="dashboard-restart-button" onClick={() => window.location.reload()} style={{ marginTop: '12px' }}>
            Refresh
          </button>
        </div>
          
          {/* Close Button */}
          <button 
            className="dashboard-close-button" 
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </motion.div>
      
      <div className="phone-container">
      {/* Status Bar */}
      <div className="status-bar">
        <img 
          src="/Dynamic Island.png" 
          alt="iPhone status bar with Dynamic Island"
          className="status-bar-image"
        />
      </div>

      {/* Main Content */}
      <div className="app-content">
        {/* Header */}
        <motion.div 
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.7, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.3
          }}
        >
          <motion.h1 
            className="routine-title"
            initial={{ opacity: 0, y: -10 }}
            animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.4
            }}
          >
            {currentExercise.title}
          </motion.h1>
          <motion.p 
            className="step-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.5
            }}
          >
            Step {currentCircle} of {currentExercise.totalSteps}
          </motion.p>
        </motion.div>

        {/* Image Container with Overlays */}
        <div className="image-container">
          <motion.img 
            key={`${currentExerciseIndex}-${currentImageSide}`}
            src={currentImage.path} 
            alt="Woman demonstrating exercise"
            className="main-image"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={hasAnimated ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          
          {/* Blur overlay at bottom */}
          <div className="image-blur-overlay image-blur-overlay-bottom"></div>
          {/* Blur overlay at top */}
          <div className="image-blur-overlay image-blur-overlay-top"></div>
          
          {/* Numbered Overlays */}
          {[1, 2, 3, 4, 5].map(num => {
            const isActive = currentCircle === num
            const isPausedState = step === 'massaging' && isPaused
            const isDragging = dragging === num
            
            // Determine animation based on step
            let animateProps = {}
            let transitionProps = {
              top: { duration: 2.5, ease: [0.4, 0, 0.2, 1] },
              right: { duration: 2.5, ease: [0.4, 0, 0.2, 1] },
              borderColor: { duration: isActive ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: isActive ? 0 : 0.5 },
              borderWidth: { duration: isActive ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: isActive ? 0 : 0.5 },
              color: { duration: isActive ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: isActive ? 0 : 0.5 }
            }
            
            if (isActive) {
              if (isPausedState) {
                // Active circle when paused - visible but no animation
                animateProps = {
                  borderColor: '#2DCEE5',
                  borderWidth: 6,
                  color: '#ffffff',
                  boxShadow: '0 0 0 6px rgba(45, 206, 229, 0.4)'
                }
                transitionProps.boxShadow = {
                  duration: 0,
                  ease: 'linear'
                }
              } else {
                // Active circle with pulse animation
                const isTransitioningToFast = step === 'massaging' && (previousStep === 'starting' || previousStep === 'idle' || previousStep === 'sealing')
                const isTransitioningToSlow = step === 'releasing' && previousStep === 'massaging'
                
                if (step === 'massaging') {
                // Always show fast pulse during massaging (0.2s duration)
                animateProps = {
                  borderColor: '#2DCEE5',
                  borderWidth: 6,
                  color: '#ffffff',
                  boxShadow: [
                    '0 0 0 6px rgba(45, 206, 229, 0.4)',
                    '0 0 0 8px rgba(45, 206, 229, 0.6)',
                    '0 0 0 6px rgba(45, 206, 229, 0.4)'
                  ]
                }
                transitionProps.boxShadow = {
                  duration: 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'loop'
                }
              } else {
                // Slow pulse for idle/sealing/starting/releasing/autoStarting
                animateProps = {
                  borderColor: '#2DCEE5',
                  borderWidth: 6,
                  color: '#ffffff',
                  boxShadow: [
                    '0 0 0 6px rgba(45, 206, 229, 0.4)',
                    '0 0 0 8px rgba(45, 206, 229, 0.6)',
                    '0 0 0 6px rgba(45, 206, 229, 0.4)'
                  ]
                }
                transitionProps.boxShadow = {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'loop',
                  repeatDelay: 0
                }
              }
              }
            } else {
              // Inactive circle - no blue border, no pulse
              animateProps = {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 4,
                boxShadow: 'none',
                color: 'rgba(255, 255, 255, 0.8)'
              }
              transitionProps.boxShadow = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: isActive ? 0 : 0.5 }
            }
            
            // Set initial state for animation
            const initialProps = isActive 
              ? {
                  borderColor: '#2DCEE5',
                  borderWidth: 6,
                  color: '#ffffff',
                  boxShadow: '0 0 0 6px rgba(45, 206, 229, 0.4)'
                }
              : {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 4,
                  color: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: 'none'
                }
            
            // Use a stable key that doesn't change with step to prevent animation resets
            // Only change key when transitioning between fast/slow pulse or active/inactive
            // Include exercise and image side to re-animate when switching
            const needsFastPulse = step === 'massaging'
            const needsSlowPulse = !needsFastPulse && isActive
            const animationKey = `${currentExerciseIndex}-${currentImageSide}-${num}-${isActive ? 'active' : 'inactive'}-${needsFastPulse ? 'fast' : needsSlowPulse ? 'slow' : 'none'}-${isDragging ? 'dragging' : 'static'}`
            
            const revealDelay = 1.2 + (num * 0.1)
            const circleRevealComplete = hasAnimated && (typeof window !== 'undefined' && window.animationStartTime ? (Date.now() - window.animationStartTime) > (revealDelay + 0.5) * 1000 : true)
            
            return (
              <motion.div
                key={animationKey}
                className={`overlay-circle overlay-${num} ${isActive ? `active ${step}${isPausedState ? ' paused' : ''}` : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                  top: `${overlayPositions[num].top}%`,
                  right: `${overlayPositions[num].right}%`
                }}
                initial={hasAnimated ? undefined : {
                  ...initialProps,
                  opacity: 0,
                  scale: 0.5
                }}
                animate={isDragging ? {
                  ...animateProps,
                  opacity: 1,
                  scale: 1
                } : hasAnimated ? {
                  ...animateProps,
                  opacity: 1,
                  scale: 1
                } : {
                  ...initialProps,
                  opacity: 0,
                  scale: 0.5
                }}
                transition={isDragging ? {
                  opacity: { duration: 0 },
                  scale: { duration: 0 },
                  borderColor: { duration: 0 },
                  borderWidth: { duration: 0 },
                  color: { duration: 0 },
                  boxShadow: { duration: 0 },
                  top: { duration: 0 },
                  right: { duration: 0 }
                } : hasAnimated ? {
                  opacity: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: revealDelay },
                  scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: revealDelay },
                  top: circleRevealComplete ? transitionProps.top : { duration: 0 },
                  right: circleRevealComplete ? transitionProps.right : { duration: 0 },
                  borderColor: circleRevealComplete ? transitionProps.borderColor : { ...transitionProps.borderColor, delay: isActive ? revealDelay + 0.2 : transitionProps.borderColor.delay },
                  borderWidth: circleRevealComplete ? transitionProps.borderWidth : { ...transitionProps.borderWidth, delay: isActive ? revealDelay + 0.2 : transitionProps.borderWidth.delay },
                  color: circleRevealComplete ? transitionProps.color : { ...transitionProps.color, delay: isActive ? revealDelay + 0.2 : transitionProps.color.delay },
                  boxShadow: circleRevealComplete ? (isActive && transitionProps.boxShadow ? transitionProps.boxShadow : transitionProps.boxShadow) : (isActive && transitionProps.boxShadow ? { ...transitionProps.boxShadow, delay: revealDelay + 0.2 } : transitionProps.boxShadow)
                } : transitionProps}
                onMouseDown={(e) => handleMouseDown(e, num)}
              >
                {num}
              </motion.div>
            )
          })}
        </div>

        {/* Instructions */}
        <motion.div 
          className="instructions"
          initial={{ opacity: 0, y: 20 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ 
            duration: 0.7, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 1.2
          }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={step === 'massaging' && showMassageInProgress ? 'massaging-progress' : step}
              initial={step === 'massaging' && showMassageInProgress ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {getInstructionText()}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Bottom Navigation */}
        <motion.div 
          className="bottom-nav"
          initial={{ opacity: 0, y: 30 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ 
            duration: 0.7, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.7
          }}
        >
          <motion.button 
            className="nav-button back-button"
            initial={{ opacity: 0 }}
            animate={hasAnimated ? { opacity: 1 } : { opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.4, 0, 0.2, 1],
              delay: 0.7
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </motion.button>
          
          <motion.button 
            className={`start-button ${step === 'sealing' ? 'sealing' : ''} ${(step === 'massaging' || step === 'starting') ? 'massaging' : ''} ${step === 'releasing' ? 'releasing' : ''} ${step === 'autoStarting' ? 'auto-starting' : ''}`}
            onClick={handleStart}
            disabled={step === 'starting' || step === 'releasing' || step === 'autoStarting' || step === 'complete'}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={hasAnimated ? { 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: (step === 'sealing' || step === 'autoStarting') ? 60 : 230,
              height: 60
            } : { opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              opacity: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.8 },
              scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.8 },
              y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.8 },
              width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
            }}
            style={{
              borderRadius: '30px', // Fixed radius - same for both states, just width changes
              overflow: step === 'sealing' ? 'visible' : 'hidden' // Allow progress ring to be visible during sealing
            }}
          >
            {step === 'sealing' && (
              <motion.svg 
                className="sealing-progress-ring"
                width="60"
                height="60"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke="rgba(233, 233, 226, 0.5)"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - sealingProgress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                  style={{
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
              </motion.svg>
            )}
            {((step === 'massaging' || step === 'starting') || step === 'releasing') && (
              <motion.div 
                className={step === 'releasing' ? 'massage-progress releasing-progress' : 'massage-progress'} 
                initial={step === 'starting' ? { opacity: 0, width: '0%' } : step === 'releasing' ? { width: '100%' } : { width: '0%' }}
                animate={{ 
                  opacity: step === 'starting' ? 0 : 1,
                  width: step === 'releasing' 
                    ? `${releasingProgress}%`
                    : step === 'starting'
                    ? '0%'
                    : isPaused
                    ? `calc(${((10 - pausedProgress) / 10) * 100}% + 1px)`
                    : `calc(${((10 - timeRemainingPrecise) / 10) * 100}% + 1px)`
                }}
                style={step === 'releasing' ? {
                  right: 'auto',
                  left: '0'
                } : {}}
                transition={{ 
                  opacity: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  width: { 
                    duration: step === 'releasing' ? 0.1 : (isPaused ? 0.3 : 0.05), 
                    ease: isPaused ? [0.4, 0, 0.2, 1] : 'linear'
                  }
                }}
              />
            )}
            {step === 'sealing' ? (
              <div className="button-dots">
                  <motion.span
                    className="dot"
                    animate={{ 
                      y: [0, -4, 0, 0, 0],
                      scale: [1, 1.1, 1, 1, 1]
                    }}
                    transition={{ 
                      duration: 1.4, 
                      repeat: Infinity, 
                      delay: 0,
                      times: [0, 0.15, 0.3, 0.5, 1],
                      ease: [[0.4, 0, 0.6, 1], [0.4, 0, 0.6, 1], "linear", "linear"]
                    }}
                  />
                  <motion.span
                    className="dot"
                    animate={{ 
                      y: [0, -4, 0, 0, 0],
                      scale: [1, 1.1, 1, 1, 1]
                    }}
                    transition={{ 
                      duration: 1.4, 
                      repeat: Infinity, 
                      delay: 0.1,
                      times: [0, 0.15, 0.3, 0.5, 1],
                      ease: [[0.4, 0, 0.6, 1], [0.4, 0, 0.6, 1], "linear", "linear"]
                    }}
                  />
                  <motion.span
                    className="dot"
                    animate={{ 
                      y: [0, -4, 0, 0, 0],
                      scale: [1, 1.1, 1, 1, 1]
                    }}
                    transition={{ 
                      duration: 1.4, 
                      repeat: Infinity, 
                      delay: 0.2,
                      times: [0, 0.15, 0.3, 0.5, 1],
                      ease: [[0.4, 0, 0.6, 1], [0.4, 0, 0.6, 1], "linear", "linear"]
                    }}
                  />
                </div>
            ) : (step === 'massaging' || step === 'starting') ? (
              <AnimatePresence mode="wait">
                {isPaused ? (
                  <motion.span 
                    key="resume"
                    className="button-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    Resume
                  </motion.span>
                ) : (
                  <motion.div
                    key="timer-pause-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <motion.span 
                      className="button-text button-timer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {formatTime(timeRemaining)}
                    </motion.span>
                    <motion.svg 
                      className="pause-icon" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                    >
                      <line x1="8" y1="6" x2="8" y2="18"/>
                      <line x1="16" y1="6" x2="16" y2="18"/>
                    </motion.svg>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : step === 'releasing' ? (
              null
            ) : step === 'autoStarting' ? (
              <span className="button-text auto-starting-countdown">{autoStartCountdown}</span>
            ) : (
              <span className="button-text">{getButtonText()}</span>
            )}
          </motion.button>
          
          <motion.button 
            className="nav-button menu-button"
            initial={{ opacity: 0 }}
            animate={hasAnimated ? { opacity: 1 } : { opacity: 0 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.4, 0, 0.2, 1],
              delay: 0.9
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="18" r="1.5"/>
            </svg>
          </motion.button>
        </motion.div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
      </div>
      </div>
    </div>
  )
}

export default App
