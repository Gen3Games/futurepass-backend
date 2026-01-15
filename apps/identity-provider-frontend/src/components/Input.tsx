import { cn } from '@futureverse/component-library'

type Props = {
  type: 'text' | 'email'
  value: string
  placeHolder?: string
  errorMessage?: string
  className?: string
  isDisabled?: boolean
  setValue: (value: string) => void
}

const Input = ({
  type,
  value,
  placeHolder,
  setValue,
  className = 'input-box',
  isDisabled,
  errorMessage,
}: Props): JSX.Element => {
  const isError = errorMessage != null
  return (
    <div
      className={cn(
        `${className} grid w-full h-full rounded-sm place-items-center`
      )}
      id={className}
    >
      <div id="input-box_container" className="input-box_container min-w-full">
        <div className="relative h-12">
          <input
            disabled={isDisabled}
            type={type}
            id="input-box_input-element"
            className={cn(
              'input-box_input-element peer h-full w-full py-[20px] px-[10px] font-normal rounded-sm border border-colorTertiary bg-transparent text-white outline outline-0 transition-all placeholder-shown:border focus:!border-t-transparent focus:outline-0 disabled:border-0 focus:border-white',
              { '!text-red-500 !border-red-500': isError },
              {
                '!border-t-transparent': value,
              }
            )}
            placeholder=" "
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
            }}
          />
          <label
            id="input-box_label"
            className={cn(
              "input-box_label before:content[' '] after:content[' '] pointer-events-none absolute text-colorTertiary left-0 -top-0.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] leading-none transition-all before:pointer-events-none before:mt-[2.3px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-sm before:border-t before:border-l before:transition-all after:pointer-events-none after:mt-[2.3px] after:rounded-tr-sm after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:border-t after:border-r after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-[0.5] peer-focus:text-white peer-focus:before:border-t-1 peer-focus:before:border-l-1 peer-focus:before:border-white peer-focus:after:border-t-1 peer-focus:after:border-r-1 peer-focus:after:rounded-tl-sm peer-focus:after:rounded-tr-sm peer-focus:after:border-white peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent before:border-colorTertiary after:border-colorTertiary hover:border-white",
              {
                '!text-red-500 peer-focus:after:border-red-500 peer-focus:before:border-red-500 before:border-red-500 after:border-red-500':
                  isError,
              },
              {
                'leading-[0.4] ': value,
              }
            )}
          >
            {placeHolder}
          </label>
        </div>
        {errorMessage && (
          <div
            id="input-box_error"
            className="input-box_error text-red-800 mt-[5px]"
          >
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default Input
