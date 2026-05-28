// src/components/TutorialPopup.tsx

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';
import AnalogyImg from '@/assets/analogy-tutorial.svg';
import ExplainImg from '@/assets/explain-tutorial.svg';

interface TutorialPopupProps {
	step: 1 | 2 | 3;
	anchorElement?: HTMLElement | null;
	onNext?: () => void;
	onBack?: () => void;
	onClose?: () => void;
	/** Pass layout-affecting state so the popup repositions during transitions */
	chatOpen?: boolean;
	sidebarCollapsed?: boolean;
	animationDuration?: number;
}

const tutorialSteps = [
	{
		title: 'Need more clarity?',
		description: "Highlight any text and select 'Explain' to explore it further.",
		buttonLabel: 'Next',
		showBack: false,
		showNext: true,
		image: ExplainImg,
	},
	{
		title: 'Need more clarity?',
		description: "Select 'Explain' on terms and short phrases for precise definitions.",
		buttonLabel: 'Next',
		showBack: true,
		showNext: true,
		image: ExplainImg,
	},
	{
		title: 'Want a relatable example?',
		description: "Use 'View Analogy' to see complex ideas in a new light.",
		buttonLabel: 'Got it',
		showBack: true,
		showNext: false,
		image: AnalogyImg,
	},
];

const TutorialPopup: React.FC<TutorialPopupProps> = ({
	step,
	anchorElement,
	onNext,
	onBack,
	onClose,
	chatOpen,
	sidebarCollapsed,
	animationDuration = 200,
}) => {
	const [position, setPosition] = useState({ top: 0, left: 0, visible: false, flipped: false });
	const popupRef = useRef<HTMLDivElement>(null);
	const animationFrameRef = useRef<number>();

	const updatePosition = React.useCallback(() => {
		if (!anchorElement) {
			setPosition(prev => ({ ...prev, visible: false }));
			return;
		}

		const rect = anchorElement.getBoundingClientRect();
		const popupWidth = 300;
		const popupHeight = 300;
		const offset = 20;

		const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
		if (!isVisible) {
			setPosition(prev => ({ ...prev, visible: false }));
			return;
		}

		let left = rect.left - popupWidth - offset;
		let top = rect.top + offset;
		let flipped = false;

		if (left < 0) {
			left = rect.left + offset;
			flipped = true;
		}
		if (left + popupWidth > window.innerWidth) {
			left = window.innerWidth - popupWidth - 20;
		}
		if (top + popupHeight > window.innerHeight) {
			top = window.innerHeight - popupHeight - 20;
		}
		if (top < 0) {
			top = 20;
		}

		setPosition({ top, left, visible: true, flipped });
	}, [anchorElement]);

	useEffect(() => {
		const handleUpdate = () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			animationFrameRef.current = requestAnimationFrame(updatePosition);
		};

		updatePosition();

		const scrollContainer = document.querySelector('.dashboard-content');
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleUpdate, { passive: true });
		}

		window.addEventListener('resize', handleUpdate, { passive: true });
		window.addEventListener('scroll', handleUpdate, { passive: true });

		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener('scroll', handleUpdate);
			}
			window.removeEventListener('resize', handleUpdate);
			window.removeEventListener('scroll', handleUpdate);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [updatePosition]);

	useEffect(() => {
		if (!anchorElement) return;

		const start = performance.now();
		const duration = animationDuration + 50;
		let rafId: number;

		const poll = () => {
			updatePosition();
			if (performance.now() - start < duration) {
				rafId = requestAnimationFrame(poll);
			}
		};
		rafId = requestAnimationFrame(poll);

		return () => cancelAnimationFrame(rafId);
	}, [chatOpen, sidebarCollapsed, anchorElement, animationDuration, updatePosition]);

	const stepIndex = step - 1;
	const { title, description, buttonLabel, showBack, showNext, image } = tutorialSteps[stepIndex];

	const portalRoot = document.body;

	if (!position.visible) {
		return null;
	}

	// Arrow border-trick styles: CSS triangles cannot be expressed as Tailwind utilities
	const arrowWrapperStyle: React.CSSProperties = position.flipped
		? { position: 'absolute', top: 35, left: -22, width: 0, height: 0, pointerEvents: 'none' }
		: { position: 'absolute', top: 35, left: 290, width: 0, height: 0, pointerEvents: 'none' };

	const arrowOuterStyle: React.CSSProperties = position.flipped
		? { position: 'absolute', top: 0, left: -8, borderRight: '16px solid #2B3854', borderTop: '16px solid transparent', borderLeft: '16px solid transparent', borderBottom: '12px solid transparent' }
		: { position: 'absolute', top: 0, left: 8, borderLeft: '16px solid #2B3854', borderTop: '16px solid transparent', borderRight: '16px solid transparent', borderBottom: '12px solid transparent' };

	const arrowInnerStyle: React.CSSProperties = position.flipped
		? { position: 'absolute', top: 0, left: -6, borderRight: '16px solid #030C34', borderTop: '16px solid transparent', borderLeft: '16px solid transparent', borderBottom: '12px solid transparent' }
		: { position: 'absolute', top: 0, left: 6, borderLeft: '16px solid #030C34', borderTop: '16px solid transparent', borderRight: '16px solid transparent', borderBottom: '12px solid transparent' };

	return createPortal(
		<div
			ref={popupRef}
			className="
     tutorial-popup pointer-events-auto fixed z-3000 w-75 scale-100
     rounded-[10px] border border-[#2F3C57] opacity-100
     transition-[opacity,transform] duration-200
   "
			style={{ top: position.top, left: position.left }}
		>
			{/* Arrow */}
			<div style={arrowWrapperStyle}>
				<div style={arrowOuterStyle} />
				<div style={arrowInnerStyle} />
			</div>

			{/* popup: relative container, image stacked above content */}
			<div className="popup relative flex flex-col overflow-clip rounded-[10px]">
				{/* Close button */}
				<button
					onClick={onClose}
					className="
       absolute top-0 right-0 z-1 flex cursor-pointer items-center
       justify-center border-none bg-transparent p-1
     "
					aria-label="Close"
				>
					<MdClose size={24} color="#FFFFFF" />
				</button>

				{/* Preload both images */}
				<img src={AnalogyImg} alt="" className="hidden" />
				<img src={ExplainImg} alt="" className="hidden" />

				{/* Tutorial image */}
				<div className="flex min-h-50 items-end justify-center bg-[#030C34]">
					<img
						src={image}
						alt={title}
						className="
        mx-auto my-3 block h-32 max-h-32 min-h-32 w-[calc(100%-48px)] rounded-lg
        object-contain
      "
					/>
				</div>

				{/* Content */}
				<div className="bg-brand-card px-3.5 pt-3.5 pb-4">
					<div className="mb-4.5">
						<div className="mb-2 font-inter text-base font-medium text-[#F2F2F2]">
							{title}
						</div>
						<div className="font-inter text-sm text-[#9CB0BC]">
							{description}
						</div>
					</div>

					<div className="relative flex min-h-10 justify-between">
						{/* Back button */}
						<div className="flex min-w-15 items-center justify-center">
							<button
								onClick={onBack}
								style={{ visibility: showBack ? 'visible' : 'hidden' }}
								tabIndex={showBack ? 0 : -1}
								aria-hidden={!showBack}
								className="
          cursor-pointer rounded-md border border-[#A8BAD8] bg-transparent px-2
          py-1.5 font-inter text-base font-medium text-[#A8BAD8]
        "
							>
								Back
							</button>
						</div>

						{/* Step dots */}
						<div className="mt-7.5 flex items-center justify-center gap-0.75">
							{[0, 1, 2].map(i => (
								<span
									key={i}
									className="
           inline-block size-1.5 rounded-full transition-[background]
           duration-200
         "
									style={{ background: stepIndex === i ? '#A8BAD8' : '#525D67' }}
								/>
							))}
						</div>

						{/* Next / Got it button */}
						<div className="flex min-w-15 items-center justify-center">
							<button
								onClick={showNext ? onNext : onClose}
								style={{ visibility: (showNext || buttonLabel === 'Got it') ? 'visible' : 'hidden' }}
								tabIndex={(showNext || buttonLabel === 'Got it') ? 0 : -1}
								aria-hidden={!(showNext || buttonLabel === 'Got it')}
								className="
          cursor-pointer rounded-sm border-none bg-[#A8BAD8] px-2 py-1.5
          font-inter text-base font-medium text-[#030C34]
        "
							>
								{buttonLabel}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>,
		portalRoot
	);
};

export default TutorialPopup;
