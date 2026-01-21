// FlipbookPreview.jsx - Full Tailwind CSS Version
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Download,
  LayoutGrid,
  Share2,
  Play,
  Pause,
  Music,
  Loader2,
  BookOpen,
  FileText,
  Bookmark,
  List,
} from "lucide-react";
import logo from "../../assets/logo/Fisto_logo.png";

const FlipbookPreview = ({
  pages,
  pageName = "Name of the Book",
  onClose,
  isMobile = false,
  isDoublePage,
}) => {
  const flipbookRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const turnInstanceRef = useRef(null);
  const initializationRef = useRef(false);
  const sliderRef = useRef(null);
  const miniaturesRef = useRef(null);
  const menuRef = useRef(null);
  const tooltiipsRef = useRef(null);

  // State
  const [isSingleView, setIsSingleView] = useState(
    isMobile || isDoublePage === false,
  );
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
  const [animationTargetView, setAnimationTargetView] = useState(false);
  const [hoveringFlipZone, setHoveringFlipZone] = useState(null); // 'left', 'right', or null
  const [cornerCurlIntensity, setCornerCurlIntensity] = useState(0); // 0-1 for visual feedback

  const animationEndTimerRef = useRef(null);
  const mouseDownRef = useRef(null);
  const cornerHoverTimerRef = useRef(null);
  const nextPageRef = useRef(null);
  const prevPageRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isNextPageFlip: false,
  });

  const totalPages = pages.length;

  // Page dimensions (A4 ratio)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  // Calculate the target offset based on view
  // Calculate the target offset based on view
  const calculateTargetOffset = useCallback(
    (view) => {
      if (isSingleView || !view) return 0;

      const visiblePages = Array.isArray(view)
        ? view.filter((p) => p > 0)
        : [view];

      // Only apply offset for COVER pages (page 1 alone or page 0)
      if (
        visiblePages.length === 1 &&
        (visiblePages[0] === 1 || visiblePages[0] === 0)
      ) {
        return -PAGE_WIDTH / 2;
      }

      // Only apply offset for LAST pages when they're single
      if (
        visiblePages.length === 1 &&
        visiblePages[0] === totalPages &&
        totalPages % 2 === 0
      ) {
        return PAGE_WIDTH / 2;
      }

      // For paired pages like [1, 2], [2, 3], [3, 4], etc. - NO OFFSET (stay centered)
      if (visiblePages.length === 2) {
        // Cover page with back or front - needs offset
        if (visiblePages[0] === 1 && visiblePages[1] === 0)
          return -PAGE_WIDTH / 2;
        if (visiblePages[0] === 0 && visiblePages[1] === 1)
          return -PAGE_WIDTH / 2;

        // Final pages when total is even - needs offset
        if (
          visiblePages[0] === totalPages &&
          visiblePages[1] === 0 &&
          totalPages % 2 === 0
        )
          return PAGE_WIDTH / 2;
        if (
          visiblePages[0] === 0 &&
          visiblePages[1] === totalPages &&
          totalPages % 2 === 0
        )
          return PAGE_WIDTH / 2;

        // All normal paired pages (1-2, 2-3, 3-4, etc.) - NO OFFSET
        return 0;
      }

      return 0;
    },
    [isSingleView, totalPages, PAGE_WIDTH],
  );

  // Handle centering offset
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
        // Remove the artificial delay - apply immediately
        setCenterOffset(targetOffset);
      }
      return;
    }

    // Apply offset immediately after animation ends
    const targetOffset = calculateTargetOffset(currentView);
    setCenterOffset(targetOffset);

    return () => {
      if (animationEndTimerRef.current) {
        clearTimeout(animationEndTimerRef.current);
      }
    };
  }, [
    isAnimating,
    isReady,
    currentView,
    animationTargetView,
    calculateTargetOffset,
  ]);

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
    audioRef.current = new Audio("/sounds/page-flip.mp3");
    audioRef.current.volume = 0.5;
    audioRef.current.preload = "auto";

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Page duration - tune for snap vs realism
  // Smooth easing for realistic book-like feel
  const FLIP_DURATION = 450; // Slightly longer for smoother feel
  const EASING_CURVE = "cubic-bezier(0.68, -0.55, 0.265, 1.55)"; // Smooth bounce easing
  const SLIDER_STEP = 1; // Page slider step size
  const MINIATURE_MARGIN = 10; // Miniature page margin
  const MINIATURE_DURATION = 500; // Miniature animation duration

  const playFlipSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) => console.warn("Flip sound failed:", e));
    }
  }, []);

  // Mouse interaction handlers for page flipping
  const handleMouseDown = useCallback(
    (e) => {
      if (!isReady || isAnimating || !flipbookRef.current) return;

      // Only allow flipping from edge regions (corners)
      const rect = flipbookRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      // Define flip zones (top and bottom corners on edges)
      const edgeZoneWidth = PAGE_WIDTH * 0.25; // 25% of page width
      const cornerZoneHeight = PAGE_HEIGHT * 0.3; // 30% of page height

      const isLeftEdge = relX < edgeZoneWidth;
      const isRightEdge = relX > rect.width - edgeZoneWidth;
      const isTopCorner = relY < cornerZoneHeight;
      const isBottomCorner = relY > rect.height - cornerZoneHeight;

      // Only trigger on corners/edges
      if (!((isLeftEdge || isRightEdge) && (isTopCorner || isBottomCorner))) {
        return;
      }

      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isNextPageFlip: isRightEdge,
      };

      mouseDownRef.current = true;

      // Add dragging visual feedback
      if (flipbookRef.current) {
        flipbookRef.current.classList.add("dragging");
      }
    },
    [isReady, isAnimating],
  );

  const handleMouseMove = useCallback((e) => {
    if (!mouseDownRef.current || !dragStateRef.current.isDragging) return;

    dragStateRef.current.currentX = e.clientX;
    dragStateRef.current.currentY = e.clientY;
  }, []);

  // Track hover over flip zones for visual feedback
  const handleMouseMoveOverFlipbook = useCallback(
    (e) => {
      if (!isReady || isAnimating || !flipbookRef.current) return;

      const rect = flipbookRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      const edgeZoneWidth = PAGE_WIDTH * 0.25;
      const cornerZoneHeight = PAGE_HEIGHT * 0.3;

      const isLeftEdge = relX < edgeZoneWidth;
      const isRightEdge = relX > rect.width - edgeZoneWidth;
      const isTopOrBottom =
        relY < cornerZoneHeight || relY > rect.height - cornerZoneHeight;

      if (isLeftEdge && isTopOrBottom) {
        setHoveringFlipZone("left");

        // Calculate curl intensity based on distance from corner
        const cornerDistance = Math.min(
          relX,
          Math.min(relY, rect.height - relY),
        );
        const intensity = 1 - cornerDistance / (edgeZoneWidth * 1.5);
        setCornerCurlIntensity(Math.max(0, Math.min(1, intensity)));

        // Auto-flip after 1.2 seconds of hovering
        if (cornerHoverTimerRef.current)
          clearTimeout(cornerHoverTimerRef.current);
        cornerHoverTimerRef.current = setTimeout(() => {
          if (prevPageRef.current && currentPage > 1) {
            prevPageRef.current();
          }
        }, 1200);
      } else if (isRightEdge && isTopOrBottom) {
        setHoveringFlipZone("right");

        // Calculate curl intensity based on distance from corner
        const cornerDistance = Math.min(
          rect.width - relX,
          Math.min(relY, rect.height - relY),
        );
        const intensity = 1 - cornerDistance / (edgeZoneWidth * 1.5);
        setCornerCurlIntensity(Math.max(0, Math.min(1, intensity)));

        // Auto-flip after 1.2 seconds of hovering
        if (cornerHoverTimerRef.current)
          clearTimeout(cornerHoverTimerRef.current);
        cornerHoverTimerRef.current = setTimeout(() => {
          if (nextPageRef.current && currentPage < totalPages) {
            nextPageRef.current();
          }
        }, 1200);
      } else {
        setHoveringFlipZone(null);
        setCornerCurlIntensity(0);
        if (cornerHoverTimerRef.current)
          clearTimeout(cornerHoverTimerRef.current);
      }
    },
    [isReady, isAnimating, currentPage, totalPages],
  );

  const handleMouseUp = useCallback(() => {
    if (!mouseDownRef.current) return;

    mouseDownRef.current = false;
    const { isDragging, startX, startY, currentX, currentY, isNextPageFlip } =
      dragStateRef.current;

    // Remove dragging visual feedback
    if (flipbookRef.current) {
      flipbookRef.current.classList.remove("dragging");
    }

    if (!isDragging) return;

    dragStateRef.current.isDragging = false;

    // Calculate drag distance
    const dragDistanceX = Math.abs(currentX - startX);
    const dragDistanceY = Math.abs(currentY - startY);
    const totalDistance = Math.sqrt(
      dragDistanceX * dragDistanceX + dragDistanceY * dragDistanceY,
    );

    // Minimum drag distance threshold to trigger flip
    const DRAG_THRESHOLD = 80;

    if (totalDistance >= DRAG_THRESHOLD) {
      if (isNextPageFlip && nextPageRef.current) {
        nextPageRef.current();
      } else if (!isNextPageFlip && prevPageRef.current) {
        prevPageRef.current();
      }
    }
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    const container = flipbookRef.current;
    if (!container) return;

    const handleMouseLeave = () => {
      setHoveringFlipZone(null);
      setCornerCurlIntensity(0);
      if (cornerHoverTimerRef.current)
        clearTimeout(cornerHoverTimerRef.current);
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMoveOverFlipbook);
    container.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMoveOverFlipbook);
      container.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (cornerHoverTimerRef.current)
        clearTimeout(cornerHoverTimerRef.current);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseMoveOverFlipbook,
    handleMouseUp,
  ]);

  // Load Script Helper
  const loadScript = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        if (window.jQuery && window.jQuery.fn.turn) {
          resolve();
          return;
        }
        existingScript.addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  // Destroy Turn.js instance and widgets safely
  const destroyTurn = useCallback(() => {
    // Destroy widgets first
    if (sliderRef.current && window.jQuery) {
      try {
        $(sliderRef.current).slider("destroy");
      } catch (e) {
        console.warn("Error destroying slider:", e);
      }
    }
    if (miniaturesRef.current && window.jQuery) {
      try {
        $(miniaturesRef.current).miniatures("disable");
      } catch (e) {
        console.warn("Error destroying miniatures:", e);
      }
    }
    if (menuRef.current && window.jQuery) {
      try {
        $(menuRef.current).menu("clear");
      } catch (e) {
        console.warn("Error destroying menu:", e);
      }
    }
    if (tooltiipsRef.current && window.jQuery) {
      try {
        $(tooltiipsRef.current).tooltips("hide");
      } catch (e) {
        console.warn("Error destroying tooltips:", e);
      }
    }

    // Then destroy Turn.js
    if (turnInstanceRef.current && window.jQuery) {
      try {
        const $el = turnInstanceRef.current;
        if ($el.data && $el.data("turn")) {
          $el.turn("destroy");
        }
      } catch (e) {
        console.warn("Turn.js cleanup:", e);
      }
    }
    turnInstanceRef.current = null;

    if (flipbookRef.current) {
      flipbookRef.current.innerHTML = "";
      flipbookRef.current.removeAttribute("style");
      flipbookRef.current.className = "";
    }
  }, []);

  // Sanitize HTML content
  const sanitizeHTML = useCallback((html) => {
    if (!html)
      return `
      <!DOCTYPE html>
      <html>
        <head><style>body{margin:0;padding:40px;font-family:Arial,sans-serif;background:#fff;}</style></head>
        <body><p style="color:#999;text-align:center;margin-top:40%;">Empty Page</p></body>
      </html>
    `;

    let content = html;

    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
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

    if (content.includes("</head>")) {
      content = content.replace("</head>", `${styleString}</head>`);
    } else if (content.includes("<body")) {
      content = content.replace("<body", `<head>${styleString}</head><body`);
    } else {
      // Fallback for bare HTML fragments
      content = styleString + content;
    }

    return (
      content.replace(/contenteditable="true"/gi, 'contenteditable="false"') +
      `
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
      </script>`
    );
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
        await loadScript("/lib/jquery.min.js?v=3.7.1");
      }

      if (!window.jQuery?.fn?.turn) {
        await loadScript("/lib/turn.min.js?v=4.1.0");
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!window.jQuery || !window.jQuery.fn.turn) {
        throw new Error("Turn.js library failed to initialize");
      }

      if (!flipbookRef.current) {
        throw new Error("Flipbook container not found");
      }

      const $ = window.jQuery;
      const $flipbook = $(flipbookRef.current);

      $flipbook.empty();
      $flipbook.removeAttr("style").removeClass();

      const bookWidth = isSingleView ? PAGE_WIDTH : PAGE_WIDTH * 2;
      const bookHeight = PAGE_HEIGHT;

      // Build pages
      pages.forEach((pageHTML, index) => {
        const pageNumber = index + 1;

        const $page = $("<div />", {
          class: `page page-${pageNumber}`,
          "data-page-number": pageNumber,
          css: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: "#ffffff",
            overflow: "hidden",
            position: "relative",
          },
        });

        const $wrapper = $("<div />", {
          class: "page-wrapper",
          css: {
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          },
        });

        const $iframe = $("<iframe />", {
          srcDoc: sanitizeHTML(pageHTML),
          css: {
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            pointerEvents: "auto", // Allow interaction
            backgroundColor: "#ffffff",
          },
          title: `Page ${pageNumber}`,
          scrolling: "no", // Keep no scrolling to maintain book look, but content is interactive
        });

        const $pageNum = $("<div />", {
          class: "page-number-overlay",
          text: pageNumber,
          css: {
            position: "absolute",
            bottom: "15px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "11px",
            color: "#aaa",
            fontWeight: "500",
            zIndex: 10,
          },
        });

        $wrapper.append($iframe);
        $page.append($wrapper, $pageNum);
        $flipbook.append($page);
      });

      // Initialize Turn.js
      $flipbook.turn({
        width: bookWidth,
        height: bookHeight,
        autoCenter: false, // Turn off internal centering to use our custom logic
        display: isSingleView ? "single" : "double",
        acceleration: true,
        gradients: true,
        elevation: 80, // Increased for smoother 3D effect
        duration: FLIP_DURATION, // 400ms smooth animation
        page: 1,
        direction: "ltr",
        pages: pages.length,
        when: {
          turning: function (event, page, view) {
            const $this = $(this);
            if ($this.data("isAnimating")) {
              event.preventDefault();
              return;
            }

            $this.data("isAnimating", true);
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
              $this.data("isAnimating", false);
              setIsAnimating(false);
            }, 100);
          },

          start: function (event, pageObject, corner) {},

          end: function (event, pageObject, turned) {
            if (!turned) {
              const $this = $(this);
              $this.data("isAnimating", false);
              setIsAnimating(false);
              setAnimationTargetView(null);
            }
          },
        },
      });

      turnInstanceRef.current = $flipbook;

      const initialView = $flipbook.turn("view");
      setCurrentView(initialView || [1]);
      setCurrentPage(1);

      if (calculateTargetOffsetRef.current) {
        setCenterOffset(calculateTargetOffsetRef.current(initialView));
      }

      // Initialize slider widget
      if (sliderRef.current && pages.length > 1) {
        try {
          $(sliderRef.current).slider({
            min: 1,
            max: pages.length,
            value: 1,
            step: SLIDER_STEP,
            change: function (event, ui) {
              if (!isAnimating) {
                $flipbook.turn("page", ui.value);
              }
            },
          });
        } catch (e) {
          console.warn(
            "Slider initialization skipped (widget not available)",
            e,
          );
        }
      }

      // Initialize miniatures widget
      if (miniaturesRef.current) {
        try {
          $(miniaturesRef.current).miniatures({
            flipbook: flipbookRef.current,
            pageMargin: MINIATURE_MARGIN,
            duration: MINIATURE_DURATION,
          });
        } catch (e) {
          console.warn(
            "Miniatures initialization skipped (widget not available)",
            e,
          );
        }
      }

      // Initialize tooltips
      if (tooltiipsRef.current) {
        try {
          $(tooltiipsRef.current).tooltips({
            selector: ".show-hint",
            className: "ui-tooltip",
            positions: "bottom,top,left,right",
          });
        } catch (e) {
          console.warn(
            "Tooltips initialization skipped (widget not available)",
            e,
          );
        }
      }

      setIsReady(true);
      initializationRef.current = false;

      console.log(
        "Turn.js initialized:",
        isSingleView ? "single" : "double",
        "view",
      );
    } catch (error) {
      console.error("Turn.js error:", error);
      setLoadingError(error.message || "Failed to initialize flipbook");
      initializationRef.current = false;
    }
  }, [
    isSingleView,
    pages,
    loadScript,
    sanitizeHTML,
    playFlipSound,
    SLIDER_STEP,
    MINIATURE_MARGIN,
    MINIATURE_DURATION,
  ]);

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
  const goToPage = useCallback(
    (page) => {
      if (!isReady || isAnimating || !turnInstanceRef.current) return;
      const targetPage = Math.max(1, Math.min(totalPages, page));
      turnInstanceRef.current.turn("page", targetPage);
    },
    [isReady, isAnimating, totalPages],
  );

  const nextPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage < totalPages) {
      turnInstanceRef.current.turn("next");
    }
  }, [isReady, isAnimating, currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage > 1) {
      turnInstanceRef.current.turn("previous");
    }
  }, [isReady, isAnimating, currentPage]);

  // Update refs so mouse handlers can access these functions
  useEffect(() => {
    nextPageRef.current = nextPage;
    prevPageRef.current = prevPage;
  }, [nextPage, prevPage]);

  // Update slider value when page changes
  useEffect(() => {
    if (sliderRef.current && !isAnimating) {
      try {
        $(sliderRef.current).slider("option", "value", currentPage);
      } catch (e) {
        // Slider not initialized
      }
    }
  }, [currentPage, isAnimating]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    if (isMobile) return;
    const currentPageNum = currentPage;
    destroyTurn();
    setIsSingleView((prev) => !prev);

    setTimeout(() => {
      if (turnInstanceRef.current) {
        turnInstanceRef.current.turn("page", currentPageNum);
      }
    }, 600);
  }, [isMobile, currentPage, destroyTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isReady) return;

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          nextPage();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prevPage();
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(totalPages);
          break;
        case "Escape":
          if (isFullscreen) toggleFullscreen();
          else if (showThumbnails) setShowThumbnails(false);
          break;
        case " ":
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isReady,
    nextPage,
    prevPage,
    goToPage,
    totalPages,
    isFullscreen,
    showThumbnails,
  ]);

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
  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.1));

  // Handle Ctrl + Scroll for zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((prev) => Math.min(1.5, prev + 0.05));
        } else {
          setZoom((prev) => Math.max(0.4, prev - 0.05));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
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
      console.error("Fullscreen error:", e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Display info
  const getDisplayInfo = () => {
    if (isSingleView) {
      return `${currentPage} / ${totalPages}`;
    }
    const view = currentView.filter((p) => p > 0);
    if (view.length === 2) {
      return `${view[0]}-${view[1]} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  };

  // Inject Turn.js styles
  useEffect(() => {
    const styleId = "flipbook-turnjs-styles";

    // Check if styles already exist
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Turn.js Dynamic Class Styles */
      #flipbook .page {
        background: #fff;
        position: absolute;
        top: 0;
      }
      
      /* Flip Zone Visual Indicators - show corners are interactive */
      #flipbook {
        cursor: grab;
        transition: cursor 0.2s ease;
        position: relative;
      }
      
      #flipbook.dragging {
        cursor: grabbing;
      }
      
      /* Corner highlight overlay on hover - left side */
      #flipbook .flip-zone-left {
        position: absolute;
        left: 0;
        top: 0;
        width: 25%;
        height: 30%;
        opacity: 0;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        border-radius: 0 0 20px 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 2;
      }
      
      #flipbook .flip-zone-left-bottom {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 25%;
        height: 30%;
        opacity: 0;
        background: linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        border-radius: 20px 0 0 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 2;
      }
      
      /* Corner highlight overlay on hover - right side */
      #flipbook .flip-zone-right {
        position: absolute;
        right: 0;
        top: 0;
        width: 25%;
        height: 30%;
        opacity: 0;
        background: linear-gradient(225deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        border-radius: 0 0 0 20px;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 2;
      }
      
      #flipbook .flip-zone-right-bottom {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 25%;
        height: 30%;
        opacity: 0;
        background: linear-gradient(315deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        border-radius: 0 0 0 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 2;
      }
      
      #flipbook:hover .flip-zone-left,
      #flipbook:hover .flip-zone-left-bottom,
      #flipbook:hover .flip-zone-right,
      #flipbook:hover .flip-zone-right-bottom {
        opacity: 1;
      }
      
      /* Enhanced dragging state */
      #flipbook.dragging {
        cursor: grabbing;
        box-shadow: 0 25px 75px rgba(0, 0, 0, 0.3) !important;
      }
      
      #flipbook.dragging .page {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25) !important;
      }
      
      /* Smooth transitions for page flips */
      #flipbook .page {
        transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1),
                    box-shadow 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      }
      
      /* Corner curl effect on hover - smooth animation */
      @keyframes cornerCurlLeft {
        0% { 
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          transform: translateX(0) rotateY(0deg);
        }
        50% { 
          clip-path: polygon(0% 0%, 95% 0%, 100% 5%, 100% 100%, 0% 100%);
          transform: translateX(2px) rotateY(5deg);
        }
        100% { 
          clip-path: polygon(0% 0%, 90% 0%, 100% 10%, 100% 100%, 0% 100%);
          transform: translateX(4px) rotateY(8deg);
        }
      }
      
      @keyframes cornerCurlRight {
        0% { 
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          transform: translateX(0) rotateY(0deg);
        }
        50% { 
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 5% 95%, 0% 5%);
          transform: translateX(-2px) rotateY(-5deg);
        }
        100% { 
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 10% 90%, 0% 10%);
          transform: translateX(-4px) rotateY(-8deg);
        }
      }
      
      #flipbook .page.flip-preview-left {
        animation: cornerCurlLeft 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        transform-origin: right center;
      }
      
      #flipbook .page.flip-preview-right {
        animation: cornerCurlRight 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        transform-origin: left center;
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
        background: #ffffff;
        border-radius: 0;
        box-shadow: none;
      }
      
      #flipbook.double-mode .odd::before {
        display: none !important;
      }
      
      #flipbook.double-mode .even {
        background: #ffffff;
        border-radius: 0;
        box-shadow: none;
      }
      
      #flipbook.double-mode .even::after {
        display: none !important;
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
        transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        transform-style: preserve-3d;
        -webkit-transform-style: preserve-3d;
      }
      
      /* Smooth cover page flip with enhanced 3D effect */
      #flipbook.single-mode .page-1,
      #flipbook.single-mode .p1 {
        transform-origin: right center;
        box-shadow: 
          inset 20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset 10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset 5px 0 10px -3px rgba(0, 0, 0, 0.08),
          6px 0 18px rgba(0, 0, 0, 0.1),
          0 15px 45px rgba(0, 0, 0, 0.2) !important;
      }
      
      /* Smooth page transitions - cover and all pages */
      #flipbook .page {
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        transform-style: preserve-3d;
        -webkit-transform-style: preserve-3d;
      }
      
      /* Enhanced flip animation for smooth feel */
      #flipbook .page.turning {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
        filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2));
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
        display: none;
      }
      
      /* Seamless pages - no center line */
      #flipbook.double-mode::before {
        display: none !important;
      }
      
      #flipbook .page {
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
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
        z-index: auto;
      }
      
      #flipbook .page.turning {
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
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
            <img
              src={logo}
              alt="Logo"
              className="h-8 w-auto object-contain bg-blend-multiply"
            />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-normal text-gray-900 tracking-wide">
            {pageName}
          </h1>
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

        {/* Miniatures Panel */}
        {isReady && showThumbnails && totalPages > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gray-900 border-r border-gray-700 overflow-y-auto z-15">
            <div
              ref={miniaturesRef}
              className="ui-miniatures"
              style={{
                height: "100%",
                padding: "10px",
              }}
            />
          </div>
        )}

        {/* Context Menu */}
        <div
          ref={menuRef}
          className="ui-menu hidden absolute bg-gray-800 rounded shadow-lg border border-gray-700 z-30"
          style={{
            minWidth: "150px",
            display: "none",
          }}
        />

        {/* Tooltips Container */}
        <div
          ref={tooltiipsRef}
          className="ui-tooltips absolute pointer-events-none"
          style={{
            zIndex: 1000,
          }}
        />
        {isReady && (
          <>
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || isAnimating}
              className={`absolute left-6 z-10 p-2 rounded-full transition-colors
                ${
                  currentPage <= 1 || isAnimating
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-gray-200"
                }`}
            >
              <ChevronLeft
                size={40}
                className="text-gray-700"
                strokeWidth={1}
              />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || isAnimating}
              className={`absolute right-6 z-10 p-2 rounded-full transition-colors
                ${
                  currentPage >= totalPages || isAnimating
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-gray-200"
                }`}
            >
              <ChevronRight
                size={40}
                className="text-gray-700"
                strokeWidth={1}
              />
            </button>
          </>
        )}
        {/* Flipbook Wrapper with Smooth Centering */}
        <div
          className="flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Center wrapper - handles offset for single page centering */}
          <div
            className="flex items-center justify-center will-change-transform"
            style={{
              transform: `translateX(${centerOffset}px)`,
              transition: isAnimating
                ? `transform ${FLIP_DURATION}ms cubic-bezier(0.165, 0.84, 0.44, 1)`
                : "transform 0.4s ease-out",
            }}
          >
            {/* Turn.js target element */}
            <div
              id="flipbook"
              ref={flipbookRef}
              className={`relative ${isSingleView ? "single-mode" : "double-mode"}`}
              style={{
                visibility: isReady ? "visible" : "hidden",
                boxShadow: isSingleView
                  ? "0 10px 30px rgba(0,0,0,0.15)"
                  : "0 20px 60px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.1)",
              }}
            />

            {/* Flip Hint Tooltip */}
            {isReady && hoveringFlipZone && (
              <div
                className="absolute pointer-events-none text-white text-sm font-medium px-4 py-3 bg-gray-900 rounded-lg shadow-lg z-20 transition-opacity duration-200"
                style={{
                  opacity: 0.95,
                  bottom: hoveringFlipZone === "left" ? "10px" : "auto",
                  top: hoveringFlipZone === "left" ? "auto" : "10px",
                  left: hoveringFlipZone === "left" ? "10px" : "auto",
                  right: hoveringFlipZone === "right" ? "10px" : "auto",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div>
                  {hoveringFlipZone === "left"
                    ? "← Previous Page"
                    : "Next Page →"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Auto-flip in {Math.ceil(cornerCurlIntensity * 1.2)}s
                </div>
              </div>
            )}
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
                    ${
                      isVisible
                        ? "ring-2 ring-indigo-500 scale-105"
                        : "opacity-70 hover:opacity-100"
                    }`}
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
              className={`p-1.5 hover:text-white rounded transition-colors ${showThumbnails ? "text-white bg-gray-600" : ""}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${isPlaying ? "text-green-400" : ""}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

          {/* Page Slider */}
          <div className="flex items-center gap-3 w-64">
            <span className="text-xs text-gray-400 w-12 text-right">
              {getDisplayInfo()}
            </span>
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
            <button
              className={`p-1.5 transition-colors ${showThumbnails ? "text-white" : "hover:text-white"}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
              title="Toggle Thumbnails"
            >
              <LayoutGrid size={18} />
            </button>
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
            <span className="text-xs w-8 text-center">
              {Math.round(zoom * 100)}%
            </span>
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
          <button
            className="hover:text-white transition-colors"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlipbookPreview;
