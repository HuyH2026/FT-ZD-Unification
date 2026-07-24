// Left column of the Headless tab: the A2A intro (gradient teal copy, robot
// glyphs, heading + description) and the 4 numbered onboarding steps, each with
// a copyable dark code block. Presentational; content from config-data.
import { CopyField } from './CopyField'
import { HEADLESS_INTRO, A2A_HEADING, A2A_DESCRIPTION, HEADLESS_STEPS } from './config-data'
import chatBotTeal from '@/assets/headless/chat-bot-teal.svg'
import chatBotPink from '@/assets/headless/chat-bot-pink.svg'
import arrowsDiff from '@/assets/headless/arrows-diff.svg'

export function HeadlessInstructions() {
  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
      <div className="mx-auto w-full max-w-[560px]">
        {/* Intro */}
        <p className="text-center text-[16px] italic leading-[22px] tracking-[-0.1px] text-[#01567a]">
          Configure Solve Headless using the menu on the right.
        </p>
        <p className="mt-4 text-center text-[16px] italic leading-[22px] tracking-[-0.1px] text-[#01567a]">
          {HEADLESS_INTRO}
        </p>

        {/* Robot glyphs */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <img src={chatBotTeal} alt="" className="size-[35px]" />
          <img src={arrowsDiff} alt="" className="size-[46px]" />
          <img src={chatBotPink} alt="" className="size-[35px]" />
        </div>

        {/* A2A heading + description */}
        <h2 className="mt-8 text-center text-[20px] font-semibold leading-[28px] tracking-[-0.1px] text-black">
          {A2A_HEADING}
        </h2>
        <p className="mt-4 text-[16px] leading-[22px] tracking-[-0.1px] text-[#01567a]">{A2A_DESCRIPTION}</p>

        {/* Steps */}
        <div className="mt-8 flex flex-col gap-8">
          {HEADLESS_STEPS.map((step) => (
            <div key={step.n}>
              <div className="flex items-center gap-3">
                <span className="text-[20px] leading-[30px] tracking-[-0.1px] text-[#1b5996]">{step.n}</span>
                <span className="font-mono text-[16px] tracking-[-0.3px] text-black">{step.title}</span>
              </div>
              <p className="mt-2 text-[14px] leading-5 tracking-[-0.1px] text-grey-800">{step.body}</p>
              <CopyField value={step.code} aria-label={`Copy code for step ${step.n}`} className="mt-3">
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 tracking-[-0.1px] text-[#e4e7f0]">
                  {step.code}
                </pre>
              </CopyField>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
