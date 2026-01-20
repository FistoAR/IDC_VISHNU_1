import React, { useState, useEffect } from 'react';
import {
  MousePointerClick,
  ChevronUp,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  ZoomIn,
  MessageSquare,
  Download,
  Info,
  Check,
  FileText,
  Type,
  Maximize,

  Edit,
  Zap,
} from 'lucide-react';

const InteractionPanel = ({ selectedElement, onUpdate }) => {
  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);
  const [interactionType, setInteractionType] = useState('none');
  const [interactionTrigger, setInteractionTrigger] = useState('click');
  const [zoomLevel, setZoomLevel] = useState(2);
  const [fitMode, setFitMode] = useState('Fit');
  const [highlightComponent, setHighlightComponent] = useState(true);

  // Values for inputs
  const [linkUrl, setLinkUrl] = useState('');
  const [navPage, setNavPage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Advanced State for Popup & Tooltip
  const [popupText, setPopupText] = useState('');
  const [popupFont, setPopupFont] = useState('Poppins');
  const [popupSize, setPopupSize] = useState('24');
  const [popupWeight, setPopupWeight] = useState('Semi Bold');
  const [popupFillColor, setPopupFillColor] = useState('#000000');
  const [popupAutoWidth, setPopupAutoWidth] = useState(true);
  const [popupAutoHeight, setPopupAutoHeight] = useState(true);

  const [tooltipText, setTooltipText] = useState('');
  const [tooltipTextColor, setTooltipTextColor] = useState('#ffffff');
  const [tooltipFillColor, setTooltipFillColor] = useState('#000000'); // Default black background for tooltip

  // Sync state with selected element attributes on mount/change
  useEffect(() => {
    if (selectedElement) {
      setInteractionType(selectedElement.getAttribute('data-interaction') || 'none');
      setInteractionTrigger(selectedElement.getAttribute('data-interaction-trigger') || 'click');

      const val = selectedElement.getAttribute('data-interaction-value') || '';
      const content = selectedElement.getAttribute('data-interaction-content') || '';

      // Reset all inputs first
      setLinkUrl('');
      setNavPage('');
      setPhoneNumber('');
      setDownloadUrl('');

      setPopupText('');
      setPopupFont('Poppins');
      setPopupSize('24');
      setPopupWeight('Semi Bold');
      setPopupFillColor('#000000');

      setTooltipText('');
      setTooltipTextColor('#ffffff');
      setTooltipFillColor('#000000');

      // Set specific input based on type
      const type = selectedElement.getAttribute('data-interaction');
      if (type === 'link') setLinkUrl(val);
      if (type === 'navigation') setNavPage(val);
      if (type === 'call') setPhoneNumber(val);
      if (type === 'zoom') setZoomLevel(Number(val) || 2);
      if (type === 'download') setDownloadUrl(val);

      if (type === 'popup') {
        setPopupText(content);
        setPopupFont(selectedElement.getAttribute('data-popup-font') || 'Poppins');
        setPopupSize(selectedElement.getAttribute('data-popup-size') || '24');
        setPopupWeight(selectedElement.getAttribute('data-popup-weight') || 'Semi Bold');
        setPopupFillColor(selectedElement.getAttribute('data-popup-fill') || '#000000');
        setPopupAutoWidth(selectedElement.getAttribute('data-popup-auto-width') !== 'false');
        setPopupAutoHeight(selectedElement.getAttribute('data-popup-auto-height') !== 'false');
      }

      if (type === 'tooltip') {
        setTooltipText(content);
        setTooltipTextColor(selectedElement.getAttribute('data-tooltip-text-color') || '#ffffff');
        setTooltipFillColor(selectedElement.getAttribute('data-tooltip-fill-color') || '#000000');
      }

      setFitMode(selectedElement.getAttribute('data-popup-fit') || 'Fit');
      setHighlightComponent(selectedElement.getAttribute('data-interaction-highlight') !== 'false');
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  // Helper to get element display name
  const getElementLabel = () => {
    if (!selectedElement) return 'Element';
    const tag = selectedElement.tagName.toLowerCase();

    // Check if it's text-like
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em'].includes(tag)) {
      const text = selectedElement.innerText || selectedElement.textContent;
      if (text && text.trim().length > 0) {
        return `Text ${text.trim().substring(0, 5)}`;
      }
      return 'Text';
    }

    if (tag === 'img') return 'Image';
    if (tag === 'button') return 'Button';
    if (tag === 'a') return 'Link';
    if (tag === 'div') return 'Container';

    return 'Element';
  };

  const formattedElementName = getElementLabel();

  // ================= APPLY INTERACTIONS =================

  const applyInteraction = (type, value, content = '') => {
    setInteractionType(type);

    if (type === 'none') {
      selectedElement.removeAttribute('data-interaction');
      selectedElement.removeAttribute('data-interaction-value');
      selectedElement.removeAttribute('data-interaction-content');
      selectedElement.removeAttribute('data-interaction-trigger');

      // Remove extra attributes
      selectedElement.removeAttribute('data-popup-font');
      selectedElement.removeAttribute('data-popup-size');
      selectedElement.removeAttribute('data-popup-weight');
      selectedElement.removeAttribute('data-popup-fill');
      selectedElement.removeAttribute('data-tooltip-text-color');
      selectedElement.removeAttribute('data-tooltip-fill-color');

      selectedElement.style.cursor = '';
    } else {
      selectedElement.setAttribute('data-interaction', type);
      selectedElement.setAttribute('data-interaction-trigger', interactionTrigger);

      if (value) selectedElement.setAttribute('data-interaction-value', value);
      else selectedElement.removeAttribute('data-interaction-value');

      if (content) selectedElement.setAttribute('data-interaction-content', content);
      else selectedElement.removeAttribute('data-interaction-content');

      // Save extra attributes for specific types
      if (type === 'popup') {
        selectedElement.setAttribute('data-popup-font', popupFont);
        selectedElement.setAttribute('data-popup-size', popupSize);
        selectedElement.setAttribute('data-popup-weight', popupWeight);
        selectedElement.setAttribute('data-popup-fill', popupFillColor);
        selectedElement.setAttribute('data-popup-auto-width', popupAutoWidth);
        selectedElement.setAttribute('data-popup-auto-height', popupAutoHeight);
      }
      if (type === 'tooltip') {
        selectedElement.setAttribute('data-tooltip-text-color', tooltipTextColor);
        selectedElement.setAttribute('data-tooltip-fill-color', tooltipFillColor);
      }

      selectedElement.setAttribute('data-popup-fit', fitMode);
      selectedElement.setAttribute('data-interaction-highlight', highlightComponent);

      selectedElement.style.cursor = 'pointer';
    }

    onUpdate(selectedElement.id, {
      interactions: { type, value, content, trigger: interactionTrigger }
    });
  };

  // Wrapper to trigger updates when advanced inputs change
  const updateAdvanced = (type) => {
    let value = null;
    let content = null;
    if (type === 'popup') content = popupText;
    if (type === 'tooltip') content = tooltipText;

    applyInteraction(type, value, content);
  }

  const handleTypeChange = (newType) => {
    setInteractionType(newType);
    if (newType === 'none') {
      applyInteraction('none', null);
    }
  };

  const handleTriggerChange = (newTrigger) => {
    setInteractionTrigger(newTrigger);
    selectedElement.setAttribute('data-interaction-trigger', newTrigger);
    onUpdate(selectedElement.id, { trigger: newTrigger });
  };
  const handleTooltipTextChange = (val) => {
    setTooltipText(val);
    applyInteraction('tooltip', null, val);
  };

  const handleTooltipColorChange = (color, isBackground = false) => {
    if (isBackground) {
      setTooltipFillColor(color);
    } else {
      setTooltipTextColor(color);
    }
    applyInteraction('tooltip', null, tooltipText);
  };

  // ================= RENDER INTERFACE =================

  const renderTargetInput = () => {
    // This renders the RIGHT side of the flow (the target input OR visual representation)
    switch (interactionType) {
      case 'none':
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            ?
          </div>
        );

      case 'popup':
        return (
          <div className="border border-gray-400 border-dashed rounded-lg p-1.5 min-w-[70px] min-h-[70px] flex flex-col items-center justify-center bg-gray-50">
            <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center mb-1 overflow-hidden border border-gray-200">
              {selectedElement.tagName === 'IMG' ? (
                <img src={selectedElement.src} className="w-full h-full object-contain" alt="Target" />
              ) : (
                <div className="text-[10px] text-gray-600 px-1 text-center line-clamp-2 leading-tight">
                  {selectedElement.innerText || 'Text'}
                </div>
              )}
            </div>
            <span className="text-[8px] text-gray-500 uppercase tracking-tight">
              {selectedElement.tagName === 'IMG' ? 'Image component' : 'Text component'}
            </span>
          </div>
        );

      case 'zoom':
        return (
          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.max(1.1, zoomLevel - 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="border border-gray-400 rounded px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[50px] text-center bg-white cursor-default">
              {Number(zoomLevel).toFixed(0)}X
            </div>

            <button
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
              onClick={() => {
                const newZoom = Math.min(5, zoomLevel + 0.1);
                setZoomLevel(newZoom);
                applyInteraction('zoom', newZoom);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        );

      case 'link':
        return (
          <div className="relative flex-grow max-w-[200px]">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onBlur={() => applyInteraction('link', linkUrl)}
              placeholder="https://example.com"
              className="w-full border border-gray-400 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        );

      case 'navigation':
        return (
          <div className="border border-gray-400 rounded-lg px-2 py-1.5 bg-white flex items-center gap-2 min-w-[100px]">
            <select
              value={navPage}
              onChange={(e) => {
                setNavPage(e.target.value);
                applyInteraction('navigation', e.target.value);
              }}
              className="appearance-none bg-transparent text-sm text-gray-700 font-medium outline-none w-full pr-4"
              style={{ backgroundImage: 'none' }}
            >
              <option value="" disabled>Select Page</option>
              <option value="1">Page 1</option>
              <option value="2">Page 2</option>
              <option value="3">Page 3</option>
              <option value="4">Page 4</option>
            </select>
            <ChevronUp size={14} className="text-gray-500 rotate-180 flex-shrink-0" />
          </div>
        );

      case 'call':
        return (
          <div className="flex flex-col items-end gap-2">
            <div className="border border-gray-400 rounded-lg flex items-center bg-white overflow-hidden p-1">
              <div className="flex items-center gap-1 px-2 border-r border-gray-200 bg-gray-50 rounded mx-1 py-0.5">
                <span className="text-xs text-gray-600 font-medium">+91</span>
                <ChevronUp size={10} className="text-gray-400 rotate-180" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => applyInteraction('call', phoneNumber)}
                placeholder="1234567890"
                className="w-28 px-2 py-1 text-sm text-gray-700 outline-none"
              />
            </div>
            <button
              className="bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-800 transition-colors"
              onClick={() => applyInteraction('call', phoneNumber)}
            >
              <Check size={12} strokeWidth={3} />
              Done
            </button>
          </div>
        );


      case 'download':
        // Download File Card UI
        return (
          <div className="min-w-[120px] max-w-[150px]">
            <div className="border border-gray-300 border-dashed rounded-xl p-3 flex flex-col items-center justify-center bg-gray-50 relative group">
              {/* Juice Image Placeholder */}
              <div className="w-16 h-16 mb-2 relative">
                {/* In a real app we'd show the actual file preview if possible, using icon for now */}
                <img
                  src="https://cdn-icons-png.flaticon.com/512/3081/3081162.png" // User provided juice image in screenshot, using generic placeholder
                  alt="File"
                  className="w-full h-full object-contain opacity-80"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                <div className="hidden absolute inset-0 items-center justify-center">
                  <Download size={32} className="text-gray-400" />
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                {downloadUrl ? downloadUrl.split('/').pop() : 'Juice .PNG'}
              </span>
            </div>
            {/* Hidden input to actually set URL if needed, or we can add an edit button */}
            <input
              type="text"
              className="mt-2 w-full text-[10px] border border-gray-200 rounded px-2 py-1"
              placeholder="File URL..."
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              onBlur={() => applyInteraction('download', downloadUrl)}
            />
          </div>
        )

      case 'tooltip':
        // Tooltip Visual
        return (
          <div className="border border-gray-400 rounded-lg p-3 min-w-[100px] h-[80px] flex items-center justify-center bg-white relative">
            <div className="relative">
              <MessageSquare size={32} className="text-gray-400 fill-gray-100" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )

      default:
        return null;
    }
  };

  const renderAdvancedEditor = () => {
    if (interactionType === 'popup') {
      return (
        <div className="mt-4 pt-1 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-bold text-gray-800">Replace Text</h3>
            <div className="h-px bg-gray-200 w-full mt-1"></div>
          </div>

          {/* Text Editor Box */}
          <div className="relative mb-3">
            <textarea
              value={popupText}
              onChange={(e) => {
                setPopupText(e.target.value);
              }}
              onBlur={() => updateAdvanced('popup')}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
              rows={3}
              placeholder='"Enhance your flipbook with rich visual elements...'
            />
            {/* <Edit2 size={14} className="absolute bottom-3 right-3 text-gray-400" /> */}
          </div>

          {/* Font Controls Row 1 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white flex items-center justify-between hover:border-gray-400 transition-colors">
              <select
                value={popupFont}
                onChange={(e) => { setPopupFont(e.target.value); setTimeout(() => updateAdvanced('popup'), 0); }}
                className="text-xs text-gray-700 font-medium w-full outline-none appearance-none bg-transparent cursor-pointer"
              >
                <option>Poppins</option>
                <option>Roboto</option>
                <option>Open Sans</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>
            <div className="w-24 border border-gray-300 rounded-lg px-3 py-2 bg-white flex items-center justify-between hover:border-gray-400 transition-colors">
              <select
                value={popupSize}
                onChange={(e) => { setPopupSize(e.target.value); setTimeout(() => updateAdvanced('popup'), 0); }}
                className="text-xs text-gray-700 font-medium w-full outline-none appearance-none bg-transparent cursor-pointer"
              >
                <option>16</option>
                <option>24</option>
                <option>32</option>
                <option>48</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>
          </div>

          {/* Font Controls Row 2 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white flex items-center justify-between hover:border-gray-400 transition-colors">
              <select
                value={popupWeight}
                onChange={(e) => { setPopupWeight(e.target.value); setTimeout(() => updateAdvanced('popup'), 0); }}
                className="text-xs text-gray-700 font-medium w-full outline-none appearance-none bg-transparent cursor-pointer"
              >
                <option>Regular</option>
                <option>Semi Bold</option>
                <option>Bold</option>
              </select>
              <ChevronUp size={14} className="rotate-180 text-gray-500" />
            </div>

            {/* Auto Width Toggle */}
            <div
              className={`flex items-center px-3 py-2 border rounded-lg bg-white gap-2 cursor-pointer transition-colors ${popupAutoWidth ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => { setPopupAutoWidth(!popupAutoWidth); setTimeout(() => updateAdvanced('popup'), 0); }}
            >
              <span className={`text-xs ${popupAutoWidth ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>Auto</span>
              <ArrowRightLeft size={14} className={`${popupAutoWidth ? 'text-indigo-600' : 'text-gray-400'}`} />
            </div>
            {/* Auto Height Toggle */}
            <div
              className={`flex items-center px-3 py-2 border rounded-lg bg-white gap-2 cursor-pointer transition-colors ${popupAutoHeight ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => { setPopupAutoHeight(!popupAutoHeight); setTimeout(() => updateAdvanced('popup'), 0); }}
            >
              <span className={`text-xs ${popupAutoHeight ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>Auto</span>
              <div className="flex flex-col items-center justify-center h-3">
                <ChevronUp size={8} className={`${popupAutoHeight ? 'text-indigo-600' : 'text-gray-400'} -mb-0.5`} />
                <ChevronUp size={8} className={`${popupAutoHeight ? 'text-indigo-600' : 'text-gray-400'} rotate-180 -mt-0.5`} />
              </div>
            </div>
          </div>

          {/* Fill Color */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 w-16">Fill Color :</span>
            <div className="w-8 h-8 rounded-md bg-black border border-gray-300 relative overflow-hidden shadow-sm">
              <input
                type="color"
                value={popupFillColor}
                onChange={(e) => { setPopupFillColor(e.target.value); }}
                onBlur={() => updateAdvanced('popup')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ backgroundColor: popupFillColor }}></div>
            </div>
            <div className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
              <span className="text-xs text-gray-600 uppercase font-mono">{popupFillColor}</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        </div>
      )
    }

    if (interactionType === 'tooltip') {
      return (
        <div className="mt-4 pt-1 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-bold text-gray-800">Edit Tooltip</h3>
            <div className="h-px bg-gray-200 w-full mt-1"></div>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl h-24 flex items-center justify-center mb-4 relative">
            {/* Simulated Tooltip */}
            <div className="relative">
              <div
                className="px-3 py-1.5 rounded text-xs whitespace-nowrap shadow-sm"
                style={{
                  backgroundColor: tooltipFillColor,
                  color: tooltipTextColor
                }}
              >
                {tooltipText || 'Centered Tooltip'}
              </div>
              {/* Triangle pointer */}
              <div
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] absolute left-1/2 -translate-x-1/2 top-full"
                style={{ borderTopColor: tooltipFillColor }}
              ></div>
            </div>
          </div>

          {/* Text Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={tooltipText}
              onChange={(e) => setTooltipText(e.target.value)}
              onBlur={() => updateAdvanced('tooltip')}
              placeholder="Centered Tooltip"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {/* <Edit2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /> */}
          </div>

          {/* Colors */}
          <div className="space-y-3">
            {/* Text Color */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700 w-10">Text :</span>
              <div className="w-8 h-8 rounded-md border border-gray-300 relative overflow-hidden shadow-sm">
                <input
                  type="color"
                  value={tooltipTextColor}
                  onChange={(e) => { setTooltipTextColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipTextColor }}></div>
              </div>
              <div className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
                <span className="text-xs text-gray-600 uppercase font-mono">{tooltipTextColor}</span>
                <span className="text-xs text-gray-400">100%</span>
              </div>
            </div>

            {/* Fill Color */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700 w-10">Fill :</span>
              <div className="w-8 h-8 rounded-md border border-gray-300 relative overflow-hidden shadow-sm">
                <input
                  type="color"
                  value={tooltipFillColor}
                  onChange={(e) => { setTooltipFillColor(e.target.value); }}
                  onBlur={() => updateAdvanced('tooltip')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ backgroundColor: tooltipFillColor }}></div>
              </div>
              <div className="flex-grow border border-gray-300 rounded-lg px-3 py-1.5 flex items-center justify-between bg-white">
                <span className="text-xs text-gray-600 uppercase font-mono">{tooltipFillColor}</span>
                <span className="text-xs text-gray-400">80%</span>
              </div>
            </div>
          </div>

        </div>
      )
    }
    return null;
  }

  const getInteractionLabel = () => {
    switch (interactionType) {
      case 'none': return 'None';
      case 'link': return 'Open Link';
      case 'navigation': return 'Navigate';
      case 'call': return 'Call';
      case 'zoom': return 'Zoom';
      case 'popup': return 'Popup';
      case 'download': return 'Download';
      case 'tooltip': return 'Tooltip';
      default: return 'None';
    }
  }

  const getTriggerLabel = () => {
    return interactionTrigger === 'click' ? 'On Click' : 'On Hover';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden md:col-span-1">

      {/* ================= HEADER ================= */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsInteractionsOpen(!isInteractionsOpen)}
      >
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-gray-600" />
          <span className="font-medium text-gray-800 text-[15px]">
            Interaction
          </span>
        </div>
        <ChevronUp
          size={16}
          className={`text-gray-500 transition-transform duration-200 ${isInteractionsOpen ? '' : 'rotate-180'}`}
        />
      </div>

      {isInteractionsOpen && (
        <div className="p-4 pt-0 animate-fadeIn space-y-4">

          {/* ================= TOP SELECTORS ================= */}
          <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-50 pb-2">
            {/* Type Selector */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm text-gray-700 font-medium">
                <span>{getInteractionLabel()}</span>
                <ArrowRightLeft size={14} className="text-gray-500" />
              </div>
              <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={interactionType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="none">None</option>
                <option value="link">Open Link</option>
                <option value="navigation">Go to Page</option>
                <option value="call">Phone Call</option>
                <option value="zoom">Zoom Image</option>
                <option value="popup">Popup Message</option>
                <option value="download">Download File</option>
                <option value="tooltip">Tooltip</option>
              </select>
            </div>

            {/* Trigger Selector */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm text-gray-700 font-medium">
                <span>{getTriggerLabel()}</span>
              </div>
              <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={interactionTrigger}
                onChange={(e) => handleTriggerChange(e.target.value)}
              >
                <option value="click">On Click</option>
                <option value="hover">On Hover</option>
              </select>
            </div>

            {/* Fit Selector (only for popup) */}
            {interactionType === 'popup' && (
              <div className="relative group ml-auto">
                <div className="flex items-center gap-2 border border-gray-400 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm text-gray-700 font-medium min-w-[80px] justify-between">
                  <span>{fitMode}</span>
                  <ChevronUp size={14} className="rotate-180 text-gray-500" />
                </div>
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={fitMode}
                  onChange={(e) => {
                    setFitMode(e.target.value);
                    selectedElement.setAttribute('data-popup-fit', e.target.value);
                    onUpdate(selectedElement.id);
                  }}
                >
                  <option value="Fit">Fit</option>
                  <option value="Fill">Fill</option>
                  <option value="Stretch">Stretch</option>
                </select>
              </div>
            )}
          </div>

          {/* ================= FLOW GRAPH ================= */}
          <div className="flex items-center justify-between mb-2 px-1 min-h-[50px]">
            {/* Source */}
            <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm font-medium">
              {formattedElementName}
            </div>

            {/* Connection */}
            <div className="flex-grow mx-4 border-b border-gray-400 border-dashed relative flex items-center justify-center">
              <div className="absolute right-0 -top-[7px]">
                <ChevronRight size={14} className="text-gray-500 text-opacity-80" />
              </div>
            </div>

            {/* Target */}
            <div className="">
              {renderTargetInput()}
            </div>
          </div>

          {/* ================= ADVANCED EDITOR ================= */}
          {renderAdvancedEditor()}

          {/* ================= FOOTER ================= */}
          <div className="pt-5 mt-4 border-t border-gray-100 flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center p-0.5 cursor-pointer 
                ${highlightComponent ? 'border-indigo-600' : 'border-gray-300'}`}
              onClick={() => {
                const newVal = !highlightComponent;
                setHighlightComponent(newVal);
                selectedElement.setAttribute('data-interaction-highlight', newVal);
                onUpdate(selectedElement.id);
              }}
            >
              <div className={`w-full h-full rounded-full ${highlightComponent ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
            </div>
            <span className="text-sm text-gray-600 font-normal">
              Highlight the Component
            </span>
          </div>

        </div>
      )}
    </div>
  );
};

export default InteractionPanel;