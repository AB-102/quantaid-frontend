import React from 'react';
import welcomeVideo from '@/assets/welcome.mp4';
import QuizProgressBar from '../common/QuizProgressBar';

// The last page of onboarding, after the profile is saved: the same layout as the profile steps, with the
// progress bar full and the welcome video. Skipping, finishing the video and Start learning all go to the map.
const WelcomeVideoStep: React.FC<{ totalSteps: number; onFinish: () => void }> = ({ totalSteps, onFinish }) => (
  <div className="
    relative mx-auto flex size-full min-h-screen flex-col items-center
    justify-start overflow-hidden bg-brand-bg text-white
  " role="main" aria-label="Welcome to Quantaid">
    <div className="
      relative z-10 mt-12 mb-16 flex w-[70%] max-w-337.5 items-center
      justify-center
    " role="navigation" aria-label="Progress navigation">
      <div className="size-6" />
      <QuizProgressBar
        currentIndex={totalSteps}
        totalQuestions={totalSteps}
        style={{
          width: '90%',
          height: 10,
          backgroundColor: '#424E62',
          borderRadius: 6,
          border: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          marginLeft: '2.5rem',
          marginRight: '2.5rem',
        }}
        fillColor="#7BA8ED"
        animationDuration={600}
      />
      <div className="size-6" />
    </div>

    <div className="
      mx-auto box-border flex w-[62%] max-w-298.75 flex-1 flex-col items-center
      justify-start px-10 pt-15 pb-10
    ">
      <h2 className="
        mx-auto w-full max-w-298.75 text-center font-inter text-[34px]
        leading-relaxed font-normal tracking-[.02em] text-white
      ">You&apos;re all set!</h2>
      <p className="text-center font-inter text-[1.2rem] text-white">
        Here&apos;s a quick tour of how Quantaid works.
      </p>
      <div className="
        mt-12 w-full max-w-225 overflow-hidden rounded-2xl border
        border-brand-border-dark bg-black shadow-[0_15px_30px_rgba(0,0,0,0.5)]
      ">
        <video
          autoPlay
          playsInline
          controls
          onEnded={onFinish}
          className="block w-full"
        >
          <source src={welcomeVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>

    <div className="
      relative z-10 mt-auto flex w-full items-center justify-center border-t
      border-[rgba(66,78,98,0.3)]
    ">
      <div className="my-6 flex w-[65%] max-w-337.5 items-center justify-end">
        <div className="flex h-15 items-center gap-4">
          <button
            className="
              min-w-20 cursor-pointer border-transparent bg-transparent px-10.5
              py-3 font-sarabun text-[22px] font-medium text-[#AAABAF]
              transition-all duration-200
              hover:text-[#AAABAF]/90
            "
            onClick={onFinish}
          >
            SKIP VIDEO
          </button>
          <button
            className="
              profile-bottom-buttons min-w-25 cursor-pointer rounded-2xl
              border-none bg-brand-deep px-10.5 py-3 font-sarabun text-[22px]
              font-medium text-white transition-all duration-200
            "
            onClick={onFinish}
          >
            START LEARNING
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default WelcomeVideoStep;
