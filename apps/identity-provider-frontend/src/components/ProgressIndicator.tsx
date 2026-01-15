import { cn, Loader } from '@futureverse/component-library'

type Props = {
  title?: string
  text?: string
}

const ProgressIndicator = ({ title, text }: Props): JSX.Element => {
  return (
    <div
      id="progress-indicator"
      className={cn(
        'progress-indicator',
        'flex flex-col justify-start h-full w-[375px] border-none rounded-sm gap-extraLarge',
        'md:border-solid md:border-[1px] md:border-colorQuaternary md:h-[393px]'
      )}
    >
      {title != null && (
        <h1
          id="progress-indicator__title"
          className="progress-indicator__title font-ObjektivMk1XBold text-fontHead pt-extraLarge pr-extraLarge pb-0 pl-extraLarge"
        >
          {title}
        </h1>
      )}
      {text != null && (
        <p
          id="progress-indicator__text"
          className="progress-indicator__text pl-extraLarge pr-extraLarge font-ObjektivMk1Thin text-colorTertiary text-fontMedium leading-[1.48]"
        >
          {text}
        </p>
      )}

      <div
        id="progress-indicator__loader"
        className="progress-indicator__loader flex w-full h-full pb-large"
      >
        <Loader className="mx-auto self-center" />
      </div>
    </div>
  )
}

export default ProgressIndicator
