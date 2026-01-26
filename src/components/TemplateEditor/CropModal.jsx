import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Crop as CropIcon } from 'lucide-react';

const CropModal = ({ isOpen, imageSrc, onClose, onConfirm }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(new Image());
    const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeDir, setResizeDir] = useState(null);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (isOpen && imageSrc) {
            const img = imageRef.current;
            img.crossOrigin = "anonymous";
            img.src = imageSrc;
            img.onload = () => {
                const container = containerRef.current;
                if (!container) return;

                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                const imgRatio = img.width / img.height;
                const containerRatio = containerWidth / containerHeight;

                let dWidth, dHeight;
                if (imgRatio > containerRatio) {
                    dWidth = containerWidth - 40;
                    dHeight = dWidth / imgRatio;
                } else {
                    dHeight = containerHeight - 40;
                    dWidth = dHeight * imgRatio;
                }

                setDisplaySize({ width: dWidth, height: dHeight });
                setCrop({
                    x: dWidth / 4,
                    y: dHeight / 4,
                    width: dWidth / 2,
                    height: dHeight / 2
                });
                draw();
            };
        }
    }, [isOpen, imageSrc]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current.complete) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = displaySize;

        canvas.width = width;
        canvas.height = height;

        // Draw background image
        ctx.drawImage(imageRef.current, 0, 0, width, height);

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // Sleek Slate-900 background
        ctx.fillRect(0, 0, width, height);

        // Draw clear crop area
        ctx.save();
        ctx.beginPath();
        ctx.rect(crop.x, crop.y, crop.width, crop.height);
        ctx.clip();

        ctx.drawImage(imageRef.current, 0, 0, width, height);

        // Draw Rule of Thirds Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(crop.x + crop.width / 3, crop.y);
        ctx.lineTo(crop.x + crop.width / 3, crop.y + crop.height);
        ctx.moveTo(crop.x + (2 * crop.width) / 3, crop.y);
        ctx.lineTo(crop.x + (2 * crop.width) / 3, crop.y + crop.height);
        // Horizontal lines
        ctx.moveTo(crop.x, crop.y + crop.height / 3);
        ctx.lineTo(crop.x + crop.width, crop.y + crop.height / 3);
        ctx.moveTo(crop.x, crop.y + (2 * crop.height) / 3);
        ctx.lineTo(crop.x + crop.width, crop.y + (2 * crop.height) / 3);
        ctx.stroke();

        ctx.restore();

        // Draw crop border (Indigo-500)
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]); // Dashed border for modern look
        ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
        ctx.setLineDash([]); // Reset

        // Draw Handles - Clear "Four Dots" Style as requested
        const handleSize = 16;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;

        // Corners
        const drawDot = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.stroke();
        };

        drawDot(crop.x, crop.y); // TL
        drawDot(crop.x + crop.width, crop.y); // TR
        drawDot(crop.x, crop.y + crop.height); // BL
        drawDot(crop.x + crop.width, crop.y + crop.height); // BR

        // Reset shadow
        ctx.shadowBlur = 0;
    }, [crop, displaySize]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const handleThreshold = 25; // Larger threshold for easier grabbing

        // Check handles (The Four Dots)
        if (Math.hypot(x - crop.x, y - crop.y) < handleThreshold) {
            setIsResizing(true);
            setResizeDir('tl');
        } else if (Math.hypot(x - (crop.x + crop.width), y - crop.y) < handleThreshold) {
            setIsResizing(true);
            setResizeDir('tr');
        } else if (Math.hypot(x - crop.x, y - (crop.y + crop.height)) < handleThreshold) {
            setIsResizing(true);
            setResizeDir('bl');
        } else if (Math.hypot(x - (crop.x + crop.width), y - (crop.y + crop.height)) < handleThreshold) {
            setIsResizing(true);
            setResizeDir('br');
        } else if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
            setIsDragging(true);
            setDragStart({ x: x - crop.x, y: y - crop.y });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging) {
            let nx = x - dragStart.x;
            let ny = y - dragStart.y;

            nx = Math.max(0, Math.min(nx, displaySize.width - crop.width));
            ny = Math.max(0, Math.min(ny, displaySize.height - crop.height));

            setCrop(prev => ({ ...prev, x: nx, y: ny }));
        } else if (isResizing) {
            let { x: cx, y: cy, width: cw, height: ch } = crop;

            if (resizeDir === 'br') {
                cw = Math.max(40, x - cx);
                ch = Math.max(40, y - cy);
                cw = Math.min(cw, displaySize.width - cx);
                ch = Math.min(ch, displaySize.height - cy);
            } else if (resizeDir === 'tl') {
                const dx = cx - x;
                const dy = cy - y;
                const newX = Math.max(0, Math.min(cx + dx, cx + cw - 40));
                const newY = Math.max(0, Math.min(cy + dy, cy + ch - 40));
                cw = cw + (cx - newX);
                ch = ch + (cy - newY);
                cx = newX;
                cy = newY;
            } else if (resizeDir === 'tr') {
                const dy = cy - y;
                const newY = Math.max(0, Math.min(cy + dy, cy + ch - 40));
                ch = ch + (cy - newY);
                cy = newY;
                cw = Math.max(40, x - cx);
                cw = Math.min(cw, displaySize.width - cx);
            } else if (resizeDir === 'bl') {
                const dx = cx - x;
                const newX = Math.max(0, Math.min(cx + dx, cx + cw - 40));
                cw = cw + (cx - newX);
                cx = newX;
                ch = Math.max(40, y - cy);
                ch = Math.min(ch, displaySize.height - cy);
            }

            setCrop({ x: cx, y: cy, width: cw, height: ch });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDir(null);
    };

    const handleConfirm = () => {
        const tempCanvas = document.createElement('canvas');
        const img = imageRef.current;

        const scaleX = img.width / displaySize.width;
        const scaleY = img.height / displaySize.height;

        tempCanvas.width = crop.width * scaleX;
        tempCanvas.height = crop.height * scaleY;

        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(
            img,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
        );

        onConfirm(tempCanvas.toDataURL('image/png', 1.0));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-[95vw] max-w-xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <CropIcon size={24} className="text-indigo-600" />
                            Adjust Image
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1">Select the perfect area</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 p-10 flex items-center justify-center bg-[#f8fafc] overflow-hidden"
                    style={{ minHeight: '400px' }}
                >
                    <div className="relative group">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="rounded-xl shadow-2xl cursor-crosshair bg-white transition-shadow duration-300 group-hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)]"
                        />
                    </div>
                </div>

                <div className="px-8 py-6 bg-white border-t border-gray-50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 text-[13px] font-black uppercase text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white text-[13px] font-black uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={20} strokeWidth={3} /> Apply Changes
                    </button>
                </div>
            </div>
            <style>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        }
      `}</style>
        </div>
    );
};

export default CropModal;
