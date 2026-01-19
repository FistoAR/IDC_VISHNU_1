// FlipbookPreview.jsx - Full Tailwind CSS Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize, Minimize, Download, LayoutGrid, Share2, Play, Pause,
  Music, Loader2, BookOpen, FileText, Bookmark, List
} from 'lucide-react';
import logo from '../../assets/logo/Fisto_logo.png';

const FlipbookPreview = ({ pages, pageName = "Name of the Book", onClose, isMobile = false, isDoublePage }) => {
  const flipbookRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const turnInstanceRef = useRef(null);
  const initializationRef = useRef(false);

  // State
  const [isSingleView, setIsSingleView] = useState(isMobile || (isDoublePage === false));
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentView, setCurrentView] = useState([1]);
  const [centerOffset, setCenterOffset] = useState(0);
  const [animationTargetView, setAnimationTargetView] = useState(null);

  const animationEndTimerRef = useRef(null);

  const totalPages = pages.length;

  // Page dimensions (A4 ratio)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  // Calculate the target offset based on view
  const calculateTargetOffset = useCallback((view) => {
    if (isSingleView || !view) return 0;

    const visiblePages = Array.isArray(view) ? view.filter(p => p > 0) : [view];

    if (visiblePages.length === 1 && visiblePages[0] === 1) {
      return -PAGE_WIDTH / 2;
    }

    if (visiblePages.length === 1 && visiblePages[0] === totalPages && totalPages % 2 === 0) {
      return PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[0] === 0 && view[1] > 0) {
      return -PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[1] === 0 && view[0] > 0) {
      return PAGE_WIDTH / 2;
    }

    return 0;
  }, [isSingleView, totalPages, PAGE_WIDTH]);

  // Handle centering offset
  useEffect(() => {
    if (animationEndTimerRef.current) {
      clearTimeout(animationEndTimerRef.current);
      animationEndTimerRef.current = null;
    }

    if (!isReady) {
      setCenterOffset(0);
      return;
    }

    if (isAnimating) {
      if (animationTargetView) {
        const targetOffset = calculateTargetOffset(animationTargetView);
        setCenterOffset(targetOffset);
      }
      return;
    }

    animationEndTimerRef.current = setTimeout(() => {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }, 50);

    return () => {
      if (animationEndTimerRef.current) {
        clearTimeout(animationEndTimerRef.current);
      }
    };
  }, [isAnimating, isReady, currentView, animationTargetView, calculateTargetOffset]);

  // Initial offset on ready
  useEffect(() => {
    if (isReady && !isAnimating) {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }
  }, [isReady]);

  // React to prop changes for view mode
  useEffect(() => {
    if (isMobile) setIsSingleView(true);
  }, [isMobile]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/page-flip.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playFlipSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Flip sound failed:", e));
    }
  }, []);

  // Load Script Helper
  const loadScript = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        if (window.jQuery && window.jQuery.fn.turn) {
          resolve();
          return;
        }
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  // Destroy Turn.js instance safely
  const destroyTurn = useCallback(() => {
    if (turnInstanceRef.current && window.jQuery) {
      try {
        const $el = turnInstanceRef.current;
        if ($el.data && $el.data('turn')) {
          $el.turn('destroy');
        }
      } catch (e) {
        console.warn('Turn.js cleanup:', e);
      }
    }
    turnInstanceRef.current = null;

    if (flipbookRef.current) {
      flipbookRef.current.innerHTML = '';
      flipbookRef.current.removeAttribute('style');
      flipbookRef.current.className = '';
    }
  }, []);

  // Sanitize HTML content
  const sanitizeHTML = useCallback((html) => {
    if (!html) return `
      <!DOCTYPE html>
      <html>
        <head><style>body{margin:0;padding:40px;font-family:Arial,sans-serif;background:#fff;}</style></head>
        <body><p style="color:#999;text-align:center;margin-top:40%;">Empty Page</p></body>
      </html>
    `;

    let content = html;

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
              * { box-sizing: border-box; }
              #flipbook .page iframe {
                pointer-events: auto;
                user-select: text;
              }
              
              #flipbook *:focus {
                outline: none !important;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `;
    }
    // Inject CSS to disable selection and focus outlines inside the iframe
    const styleString = `
      <style>
        * {
          outline: none !important;
          -webkit-touch-callout: none !important;
        }
        /* Allow interaction and selection */
        *::selection { background: rgba(59, 130, 246, 0.3); }
        *::-moz-selection { background: rgba(59, 130, 246, 0.3); }
      </style>
    `;

    if (content.includes('</head>')) {
      content = content.replace('</head>', `${styleString}</head>`);
    } else if (content.includes('<body')) {
      content = content.replace('<body', `<head>${styleString}</head><body`);
    } else {
      // Fallback for bare HTML fragments
      content = styleString + content;
    }

    return content
      .replace(/contenteditable="true"/gi, 'contenteditable="false"')
      + `
      <script>
        (function() {
          console.log("Flipbook Script: Initializing...");
          
          function init() {
            const elements = document.querySelectorAll('[data-interaction]');
            console.log("Flipbook Script: Found " + elements.length + " interactive elements");
            
            elements.forEach(function(el) {
              const type = el.getAttribute('data-interaction');
              const trigger = el.getAttribute('data-interaction-trigger') || 'click';
              
              function runInteraction() {
                console.log("Flipbook Script: Interaction triggered - " + type);
                
                if (type === 'link') {
                  const url = el.getAttribute('data-interaction-value');
                  if (url) window.open(url, '_blank');
                }
                
                if (type === 'navigation') {
                  const page = el.getAttribute('data-interaction-value');
                  if (page && window.parent.handleFlipbookNavigation) {
                    window.parent.handleFlipbookNavigation(page);
                  }
                }

                if (type === 'call') {
                  const val = el.getAttribute('data-interaction-value');
                  if (val) window.open('tel:' + val);
                }

                if (type === 'download') {
                  const val = el.getAttribute('data-interaction-value');
                  if (val) window.open(val, '_blank');
                }

                if (type === 'zoom') {
                  const scale = el.getAttribute('data-interaction-value') || 2;
                  if (el.style.transform && el.style.transform.indexOf('scale') !== -1) {
                     el.style.transform = el.style.transform.replace(/scale\\([^)]+\\)/, 'scale(1)');
                     el.style.zIndex = '';
                  } else {
                     el.style.transition = 'transform 0.3s ease';
                     el.style.transform = 'scale(' + scale + ')';
                     el.style.zIndex = '1000';
                     el.style.position = 'relative';
                     setTimeout(function() {
                       el.style.transform = 'scale(1)';
                       el.style.zIndex = '';
                     }, 2000);
                  }
                }
                
                if (type === 'popup') {
                    const existing = el.querySelector('.interaction-popup');
                    if (existing) { existing.remove(); return; }
                    
                    const content = el.getAttribute('data-interaction-content') || '';
                    const font = el.getAttribute('data-popup-font') || 'Poppins';
                    const fill = el.getAttribute('data-popup-fill') || '#ffffff';
                    
                    const div = document.createElement('div');
                    div.className = 'interaction-popup';
                    div.innerText = content;
                    div.style.position = 'absolute';
                    div.style.bottom = '110%';
                    div.style.left = '50%';
                    div.style.transform = 'translateX(-50%)';
                    div.style.background = fill;
                    div.style.padding = '10px';
                    div.style.borderRadius = '8px';
                    div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                    div.style.fontFamily = font;
                    div.style.zIndex = '10000';
                    div.style.pointerEvents = 'none';
                    div.style.minWidth = '150px';
                    div.style.textAlign = 'center';
                    div.style.color = (fill === '#ffffff' || fill === '#fff') ? '#000' : '#fff';

                    if (el.style.position !== 'absolute') el.style.position = 'relative';
                    el.appendChild(div);
                    setTimeout(function() { div.remove(); }, 3000);
                }
                
                if (type === 'tooltip') {
                    const content = el.getAttribute('data-interaction-content') || '';
                    const fill = el.getAttribute('data-tooltip-fill-color') || '#000000';
                    const textC = el.getAttribute('data-tooltip-text-color') || '#ffffff';
                    
                    // Remove existing tooltips to prevent duplicates
                    const existing = el.querySelector('.interaction-tooltip');
                    if (existing) existing.remove();

                    const div = document.createElement('div');
                    div.className = 'interaction-tooltip';
                    div.innerText = content;
                    div.style.position = 'absolute';
                    div.style.background = fill;
                    div.style.color = textC;
                    div.style.padding = '5px 10px';
                    div.style.borderRadius = '4px';
                    div.style.fontSize = '12px';
                    div.style.whiteSpace = 'nowrap';
                    div.style.zIndex = '10000';
                    div.style.pointerEvents = 'none';
                    div.style.opacity = '0';
                    div.style.transition = 'opacity 0.2s';
                    
                    // Initial append to calculate size or just force top
                    if (el.style.position !== 'absolute') el.style.position = 'relative';
                    el.appendChild(div);
                    
                    // Smart Position Logic
                    const rect = el.getBoundingClientRect();
                    const tooltipHeight = 30; // approx
                    const spaceAbove = rect.top;
                    
                    if (spaceAbove < tooltipHeight + 10) {
                        // Show below
                        div.style.top = '100%';
                        div.style.bottom = 'auto'; // Reset
                        div.style.left = '50%';
                        div.style.transform = 'translateX(-50%) translateY(5px)';
                        
                        // Triangle pointing up
                        const tri = document.createElement('div');
                        tri.style.position = 'absolute';
                        tri.style.bottom = '100%';
                        tri.style.left = '50%';
                        tri.style.transform = 'translateX(-50%)';
                        tri.style.borderWidth = '5px';
                        tri.style.borderStyle = 'solid';
                        tri.style.borderColor = 'transparent transparent ' + fill + ' transparent';
                        div.appendChild(tri);
                    } else {
                        // Show above (Default)
                        div.style.bottom = '100%';
                        div.style.top = 'auto'; // Reset
                        div.style.left = '50%';
                        div.style.transform = 'translateX(-50%) translateY(-5px)';
                        
                        // Triangle pointing down
                        const tri = document.createElement('div');
                        tri.style.position = 'absolute';
                        tri.style.top = '100%';
                        tri.style.left = '50%';
                        tri.style.transform = 'translateX(-50%)';
                        tri.style.borderWidth = '5px';
                        tri.style.borderStyle = 'solid';
                        tri.style.borderColor = fill + ' transparent transparent transparent';
                        div.appendChild(tri);
                    }
                    
                    // Fade in
                    requestAnimationFrame(() => div.style.opacity = '1');
                    
                    el.addEventListener('mouseleave', function() { div.remove(); }, {once:true});
                }
              }

              if (trigger === 'click') {
                el.style.cursor = 'pointer';
                el.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  runInteraction();
                });
              } else {
                // Assuming hover
                el.addEventListener('mouseenter', runInteraction);
              }
            });
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
          } else {
            init();
          }
        })();
      </script>
      `;
  }, []);

  // Store calculateTargetOffset in a ref
  const calculateTargetOffsetRef = useRef(calculateTargetOffset);
  useEffect(() => {
    calculateTargetOffsetRef.current = calculateTargetOffset;
  }, [calculateTargetOffset]);

  // Initialize Turn.js
  const initializeTurnJs = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      setIsReady(false);
      setLoadingError(null);

      if (!window.jQuery) {
        await loadScript('/lib/jquery.min.js?v=3.7.1');
      }

      if (!window.jQuery?.fn?.turn) {
        await loadScript('/lib/turn.min.js?v=4.1.0');
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      if (!window.jQuery || !window.jQuery.fn.turn) {
        throw new Error('Turn.js library failed to initialize');
      }

      if (!flipbookRef.current) {
        throw new Error('Flipbook container not found');
      }

      const $ = window.jQuery;
      const $flipbook = $(flipbookRef.current);

      $flipbook.empty();
      $flipbook.removeAttr('style').removeClass();

      const bookWidth = isSingleView ? PAGE_WIDTH : PAGE_WIDTH * 2;
      const bookHeight = PAGE_HEIGHT;

      // Build pages
      pages.forEach((pageHTML, index) => {
        const pageNumber = index + 1;

        const $page = $('<div />', {
          'class': `page page-${pageNumber}`,
          'data-page-number': pageNumber,
          css: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            position: 'relative'
          }
        });

        const $wrapper = $('<div />', {
          'class': 'page-wrapper',
          css: {
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }
        });

        const $iframe = $('<iframe />', {
          srcDoc: sanitizeHTML(pageHTML),
          css: {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: 'auto', // Allow interaction
            backgroundColor: '#ffffff'
          },
          title: `Page ${pageNumber}`,
          scrolling: 'no' // Keep no scrolling to maintain book look, but content is interactive
        });

        const $pageNum = $('<div />', {
          'class': 'page-number-overlay',
          text: pageNumber,
          css: {
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: '#aaa',
            fontWeight: '500',
            zIndex: 10
          }
        });

        $wrapper.append($iframe);
        $page.append($wrapper, $pageNum);
        $flipbook.append($page);
      });

      // Initialize Turn.js
      $flipbook.turn({
        width: bookWidth,
        height: bookHeight,
        autoCenter: true,
        display: isSingleView ? 'single' : 'double',
        acceleration: true,
        gradients: true,
        elevation: 50,
        duration: 800,
        page: 1,
        direction: 'ltr',

        when: {
          turning: function (event, page, view) {
            const $this = $(this);
            if ($this.data('isAnimating')) {
              event.preventDefault();
              return;
            }

            $this.data('isAnimating', true);
            setIsAnimating(true);
            setAnimationTargetView(view);
            playFlipSound();
          },

          turned: function (event, page, view) {
            const $this = $(this);

            setCurrentPage(page);
            setCurrentView(view || [page]);
            setAnimationTargetView(null);

            setTimeout(() => {
              $this.data('isAnimating', false);
              setIsAnimating(false);
            }, 100);
          },

          start: function (event, pageObject, corner) { },

          end: function (event, pageObject, turned) {
            if (!turned) {
              const $this = $(this);
              $this.data('isAnimating', false);
              setIsAnimating(false);
              setAnimationTargetView(null);
            }
          }
        }
      });

      turnInstanceRef.current = $flipbook;

      const initialView = $flipbook.turn('view');
      setCurrentView(initialView || [1]);
      setCurrentPage(1);
      setIsReady(true);
      initializationRef.current = false;

      console.log('Turn.js initialized:', isSingleView ? 'single' : 'double', 'view');

    } catch (error) {
      console.error('Turn.js error:', error);
      setLoadingError(error.message || 'Failed to initialize flipbook');
      initializationRef.current = false;
    }
  }, [isSingleView, pages, loadScript, sanitizeHTML, playFlipSound]);

  // Initialize on mount and view change
  useEffect(() => {
    destroyTurn();
    initializationRef.current = false;
    setCenterOffset(0);
    setAnimationTargetView(null);

    const timer = setTimeout(() => {
      initializeTurnJs();
    }, 200);

    return () => {
      clearTimeout(timer);
      destroyTurn();
    };
  }, [isSingleView, pages]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    const targetPage = Math.max(1, Math.min(totalPages, page));
    turnInstanceRef.current.turn('page', targetPage);
  }, [isReady, isAnimating, totalPages]);

  const nextPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage < totalPages) {
      turnInstanceRef.current.turn('next');
    }
  }, [isReady, isAnimating, currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage > 1) {
      turnInstanceRef.current.turn('previous');
    }
  }, [isReady, isAnimating, currentPage]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    if (isMobile) return;
    const currentPageNum = currentPage;
    destroyTurn();
    setIsSingleView(prev => !prev);

    setTimeout(() => {
      if (turnInstanceRef.current) {
        turnInstanceRef.current.turn('page', currentPageNum);
      }
    }, 600);
  }, [isMobile, currentPage, destroyTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isReady) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
        case 'Escape':
          if (isFullscreen) toggleFullscreen();
          else if (showThumbnails) setShowThumbnails(false);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, nextPage, prevPage, goToPage, totalPages, isFullscreen, showThumbnails]);

  // Autoplay
  useEffect(() => {
    let interval;
    if (isPlaying && isReady && !isAnimating) {
      interval = setInterval(() => {
        if (currentPage < totalPages) {
          nextPage();
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isReady, isAnimating, currentPage, totalPages, nextPage]);

  // Zoom
  const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.1));

  // Handle Ctrl + Scroll for zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom(prev => Math.min(1.5, prev + 0.05));
        } else {
          setZoom(prev => Math.max(0.4, prev - 0.05));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Display info
  const getDisplayInfo = () => {
    if (isSingleView) {
      return `${currentPage} / ${totalPages}`;
    }
    const view = currentView.filter(p => p > 0);
    if (view.length === 2) {
      return `${view[0]}-${view[1]} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  };

  // Inject Turn.js styles
  useEffect(() => {
    const styleId = 'flipbook-turnjs-styles';

    // Check if styles already exist
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Turn.js Dynamic Class Styles */
      #flipbook .page {
        background: #fff;
        position: absolute;
        top: 0;
      }
      
      #flipbook.single-mode .page {
        background: linear-gradient(to right, #f5f5f5 0%, #ffffff 3%, #ffffff 100%);
        box-shadow: 
          inset 12px 0 25px -8px rgba(0, 0, 0, 0.15),
          inset 6px 0 10px -4px rgba(0, 0, 0, 0.08),
          inset 3px 0 6px -2px rgba(0, 0, 0, 0.05),
          -4px 0 15px rgba(0, 0, 0, 0.08),
          0 8px 30px rgba(0, 0, 0, 0.12);
        border-radius: 3px;
      }
      
      #flipbook.single-mode .page::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.06) 0%,
          rgba(0, 0, 0, 0.03) 30%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .odd {
        background: linear-gradient(to right, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 0 3px 3px 0;
        box-shadow: 
          inset 15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset 8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset 4px 0 8px -2px rgba(0, 0, 0, 0.06),
          4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .odd::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .even {
        background: linear-gradient(to left, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 3px 0 0 3px;
        box-shadow: 
          inset -15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset -8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset -4px 0 8px -2px rgba(0, 0, 0, 0.06),
          -4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .even::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to left,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook .page-1,
      #flipbook .p1 {
        border-radius: 0 4px 4px 0 !important;
        background: linear-gradient(to right, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%) !important;
        box-shadow: 
          inset 20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset 10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset 5px 0 10px -3px rgba(0, 0, 0, 0.08),
          6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15) !important;
      }
      
      #flipbook .page:last-child {
        border-radius: 4px 0 0 4px;
        background: linear-gradient(to left, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%);
        box-shadow: 
          inset -20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset -10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset -5px 0 10px -3px rgba(0, 0, 0, 0.08),
          -6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15);
      }
      
      #flipbook.double-mode::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 8px;
        transform: translateX(-50%);
        background: linear-gradient(to right, 
          rgba(0, 0, 0, 0.15) 0%, 
          rgba(0, 0, 0, 0.08) 20%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(0, 0, 0, 0.08) 80%,
          rgba(0, 0, 0, 0.15) 100%
        );
        z-index: 1000;
        pointer-events: none;
      }
      
      #flipbook.double-mode::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.3);
        z-index: 1001;
        pointer-events: none;
      }
      
      #flipbook .gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      
      #flipbook * {
        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;
      }
      
      #flipbook .page {
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
      }
      
      #flipbook .turn-page {
        z-index: 500 !important;
      }
      
      #flipbook .page.turning {
        z-index: 1000 !important;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25), 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#F5F5F5] z-[100] flex flex-col font-sans text-gray-800"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#F5F5F5] z-20">
        <div className="flex items-center w-64">
          <div className="bg-white p-2 border border-gray-200 shadow-sm">
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain bg-blend-multiply" />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-normal text-gray-900 tracking-wide">{pageName}</h1>
        </div>
        <div className="w-64 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-gray-200 border border-black rounded-md text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to work
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#F5F5F5]">

        {/* Loading State */}
        {!isReady && !loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F5F5] z-50">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Preparing flipbook...</p>
          </div>
        )}

        {/* Error State */}
        {loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <p className="text-red-500 mb-4">{loadingError}</p>
            <button
              onClick={() => {
                setLoadingError(null);
                initializationRef.current = false;
                initializeTurnJs();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Arrows */}
        {isReady && (
          <>
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || isAnimating}
              className={`absolute left-6 z-10 p-2 rounded-full transition-colors
                ${currentPage <= 1 || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronLeft size={40} className="text-gray-700" strokeWidth={1} />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || isAnimating}
              className={`absolute right-6 z-10 p-2 rounded-full transition-colors
                ${currentPage >= totalPages || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronRight size={40} className="text-gray-700" strokeWidth={1} />
            </button>
          </>
        )}

        {/* Flipbook Wrapper with Smooth Centering */}
        <div
          className="flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Center wrapper - handles offset for single page centering */}
          <div
            className="flex items-center justify-center will-change-transform"
            style={{
              transform: `translateX(${centerOffset}px)`,
              transition: isAnimating
                ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Turn.js target element */}
            <div
              id="flipbook"
              ref={flipbookRef}
              className={`relative shadow-[0_10px_40px_rgba(0,0,0,0.2)] ${isSingleView ? 'single-mode' : 'double-mode'}`}
              style={{
                visibility: isReady ? 'visible' : 'hidden'
              }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="absolute bottom-16 left-0 right-0 bg-[#333]/95 backdrop-blur-sm z-40 p-4 border-t border-gray-700">
          <div className="flex gap-4 overflow-x-auto pb-2 justify-center scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {pages.map((html, idx) => {
              const pageNum = idx + 1;
              const isVisible = currentView.includes(pageNum);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    goToPage(pageNum);
                    setShowThumbnails(false);
                  }}
                  className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 w-20 h-28
                    ${isVisible
                      ? 'ring-2 ring-indigo-500 scale-105'
                      : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className="w-full h-full bg-white rounded-sm overflow-hidden flex items-center justify-center text-gray-500 font-bold shadow-md">
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="h-14 bg-[#3E3E3E] text-gray-300 flex items-center px-4 justify-between z-30 select-none">
        <div className="w-16 flex justify-start">
          <button className="p-2 hover:text-white transition-colors">
            <List size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Thumbnails & Autoplay */}
          <div className="flex items-center gap-2 border-r border-gray-600 pr-6">
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${showThumbnails ? 'text-white bg-gray-600' : ''}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${isPlaying ? 'text-green-400' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

          {/* Page Slider */}
          <div className="flex items-center gap-3 w-64">
            <span className="text-xs text-gray-400 w-12 text-right">{getDisplayInfo()}</span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              disabled={isAnimating}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:bg-[#6C63FF] 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3 
                [&::-moz-range-thumb]:h-3 
                [&::-moz-range-thumb]:bg-[#6C63FF] 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-none"
            />
          </div>

          {/* View Mode & Features */}
          <div className="flex items-center gap-4 border-l border-gray-600 pl-6 border-r pr-6">
            {!isMobile && (
              <button
                className="p-1.5 hover:text-white transition-colors"
                onClick={toggleViewMode}
                title={isSingleView ? "Switch to Double" : "Switch to Single"}
              >
                {isSingleView ? <BookOpen size={18} /> : <FileText size={18} />}
              </button>
            )}
            <button className="p-1.5 hover:text-white transition-colors">
              <Bookmark size={18} />
            </button>
            <button className="p-1.5 hover:text-white transition-colors">
              <Music size={18} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="w-auto flex justify-end gap-3 pl-6 border-l border-gray-600">
          <button className="hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
          <button className="hover:text-white transition-colors">
            <Download size={18} />
          </button>
          <button className="hover:text-white transition-colors" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlipbookPreview;